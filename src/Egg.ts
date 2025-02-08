import { Scene } from "phaser";
import { Fighting, FightingState } from "./scenes/Fighting";

export enum EggState {
    FLYING,
    COLLIDED,
    MARIO_STANDING_ON_IT,
    PICKED_UP,
    THROWED,
    DROPPED
}

export class Egg extends Phaser.Physics.Arcade.Sprite {

    public state: EggState;
    public dynamicBody: Phaser.Physics.Arcade.Body;
    private flyingDirection: "right" | "left";
    private throwedDirection: "right" | "left" | null;

    constructor(scene: Scene, x: number, y: number, texture: string, direction: "right" | "left") {
        super(scene, x, y, texture);
        // Add the sprite to the scene
        scene.add.existing(this);
        // Enable physics on this sprite
        scene.physics.add.existing(this);

        this.dynamicBody = this.body as Phaser.Physics.Arcade.Body;
        this.state = EggState.FLYING;

        this.flyingDirection = direction;
        this.throwedDirection = null;
        this.setVelocityX(this.flyingDirection === "right" ? 100 : -100);
        this.setVelocityY(0);
        this.setPushable(false);
        this.setGravityY(-1000);

        this.setSize(18, 16);
        this.setOrigin(0);
        this.setOffset(0);

        this.refreshBody();

    }

    standOn() {
        this.state = EggState.MARIO_STANDING_ON_IT;
    }

    pickUp() {


        this.state = EggState.PICKED_UP;
    }

    drop(direction: "right" | "left") {

        this.state = EggState.DROPPED;

        this.dynamicBody.checkCollision.none = true; // Disable collisions so that it can just drop out of view. 

        this.setGravityY(200)
        this.setVelocityX(direction === "right" ? 50 : -50);
    }

    throw(direction: "right" | "left") {

        this.state = EggState.THROWED;
        this.throwedDirection = direction;

        // Egg will move slightly upwards and to the right or left depending on direction, but then be pulled down by gravity 
        this.setGravityY(400);
        this.setVelocityY(-100);
        this.setVelocityX(this.throwedDirection === "right" ? 400 : -400);
    }

    handleCollision(_: any) {

        if ([EggState.FLYING, EggState.THROWED].includes(this.state)) {
            this.state = EggState.COLLIDED;

            this.dynamicBody.checkCollision.none = true; // turn off collisions from now on and let egg bounce out of view. 

            // Egg will move slightly upwards and to the right or left depending on collision side, but then be pulled down by gravity 
            this.setGravityY(400);
            this.setVelocityY(this.dynamicBody.touching.down ? -250 : 0);
            this.setVelocityX(this.dynamicBody.touching.right || this.throwedDirection === "right" ? -150 : 150);
        }
    }

    preUpdate(time: number, delta: number) {

        super.preUpdate(time, delta);

        if ([EggState.FLYING, EggState.COLLIDED, EggState.THROWED, EggState.DROPPED].includes(this.state) && this.isOutSideOfWorld()) {
            this.destroy();
            return;
        }

        if ((this.scene as Fighting).state !== FightingState.FIGHTING) {
            this.drop(this.flyingDirection)
        }

    }

    private isOutSideOfWorld(): boolean {
        const worldBounds = this.scene.physics.world.bounds;
        return this.dynamicBody.right < worldBounds.left || this.dynamicBody.top >= worldBounds.bottom || this.dynamicBody.left > worldBounds.right;

    }
}