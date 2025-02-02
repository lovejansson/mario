import Phaser, { Scene } from "phaser";
import { Birdo } from "./Birdo";


export enum CarrotState {
    GROUNDED,
    PICKED_UP,
    THROWED,
    DROPPED,
    COLLIDED,
}


export class Carrot extends Phaser.Physics.Arcade.Sprite {

    public id: string;
    public state: CarrotState;
    public dynamicBody: Phaser.Physics.Arcade.Body;


    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        // Add the sprite to the scene
        scene.add.existing(this);
        // Enable physics on this sprite
        scene.physics.add.existing(this);

        this.id = "carrot" + Math.random();
        this.state = CarrotState.GROUNDED;
        this.dynamicBody = this.body as Phaser.Physics.Arcade.Body;

        this.setGravityY(-1000) // Cancels out world gravity when marios picks it up..
        this.setTexture("carrot-grounded");
        this.setSize(18, 10);
        this.setVelocity(0, 0);
        this.setPushable(false);
        this.setOrigin(0);
        this.refreshBody();

    }


    isThrowed() {
        return this.state === CarrotState.THROWED;
    }


    pickUp() {
        this.setTexture(`carrot-${Math.random() > 0.5 ? "white" : "orange"}`);
        this.setSize(18, 20);

        // Inactivate collider with platform so that it can later get thrown or dropped out of view. 
        this.scene.physics.world.colliders.getActive().forEach(collider => {
            if (collider.name === "carrot-platform" && collider.object1 === this) {
                collider.active = false;
            }
        });
    }


    drop(direction: "right" | "left") {
        this.state = CarrotState.DROPPED;

        this.dynamicBody.checkCollision.none = true; // Disable collisions so that it can just drop out of view.

        this.setGravityY(200);
        this.setVelocityX(direction === "right" ? 50 : -50);
    }



    throw(direction: "right" | "left") {
        // Carrot will move slightly upwards and to the right or left depending on direction, but then be pulled down by gravity 
        this.setGravityY(2);
        this.setVelocityY(-100);
        this.setVelocityX(direction === "right" ? 400 : -400);

        this.state = CarrotState.THROWED;
    }


    handleCollision(obj: any) {

        if (obj instanceof Birdo) {
            if (this.state === CarrotState.THROWED) {

                this.state = CarrotState.COLLIDED;

                this.dynamicBody.checkCollision.none = true; // turn off collisions from now on and let carrot bounce out of view. 

                // Carrot will move slightly upwards and to the right or left depending on collision side, but then be pulled down by gravity 
                this.setGravityY(400);
                this.setVelocityY(-100);
                this.setVelocityX(this.dynamicBody.touching.right ? -150 : 150);
            }

        }

    }


    preUpdate(time: number, delta: number) {

        super.preUpdate(time, delta);


        if ([CarrotState.COLLIDED, CarrotState.THROWED, CarrotState.DROPPED].includes(this.state) && this.isOutSideOfWorld()) {
            this.destroy();
            return;
        }
    }


    private isOutSideOfWorld(): boolean {
        const worldBounds = this.scene.physics.world.bounds;
        return this.dynamicBody.right <= worldBounds.left || this.dynamicBody.top >= worldBounds.bottom || this.dynamicBody.left >= worldBounds.right;
    }

}