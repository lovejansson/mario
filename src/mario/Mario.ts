import { GameObjects, Scene } from "phaser";
import { Egg } from "../Egg";
import { Fighting, FightingState } from "../scenes/Fighting";
import MarioBehaviourTree from "./MarioBehaviourTree";
import { Birdo } from "../Birdo";
import { Carrot } from "../Carrot";
import { ItemType, MarioDucking, MarioHoldingItem, MarioIdle, MarioJumping, MarioPickingItem, MarioStandingAtCarrot, MarioStandingOnEgg, MarioStateUpdate, MarioThrowingItem, MarioWalking } from "./MarioStates";

type PhaserSound = Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;

export class Mario extends Phaser.Physics.Arcade.Sprite {

    private movement: MarioStateUpdate;
    private holdingItem: MarioHoldingItem;
    private standingOnEgg: MarioStandingOnEgg;
    private standingAtCarrot: MarioStandingAtCarrot;
    public isHurting: boolean;

    private counter: number;

    private lives: number;
    private livesGroup: Phaser.GameObjects.Group;

    public dynamicBody: Phaser.Physics.Arcade.Body;

    private soundWon: PhaserSound;
    private tree: MarioBehaviourTree;
    private fightingScene: Fighting;

    constructor(scene: Scene, x: number, y: number, texture: string) {

        super(scene, x, y, texture);

        // Add the sprite to the scene
        scene.add.existing(this);
        // Enable physics on this sprite
        scene.physics.add.existing(this);
        this.fightingScene = this.scene as Fighting;


        this.movement = new MarioIdle("right");

        this.holdingItem = new MarioHoldingItem(null);
        this.standingOnEgg = new MarioStandingOnEgg(null);
        this.standingAtCarrot = new MarioStandingAtCarrot(null);

        this.lives = 3;
        this.livesGroup = scene.add.group([]);
        this.counter = 0;
        this.isHurting = false;

        this.dynamicBody = this.body as Phaser.Physics.Arcade.Body;
        this.setSize(24, 32);
        this.setOrigin(0);
        this.setPosition(x, y);
        this.dynamicBody.setSlideFactor(0, 0);
        this.refreshBody();

        this.tree = new MarioBehaviourTree(this);

        // Create animations

        this.createAnimations()
        this.soundWon = this.fightingScene.sound.add("mario-won");

    }

    public playSound(key: string) {
        this.fightingScene.sound.play(key);
    }

    private createAnimations() {

        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'mario-walk', frame: 0 },
                { key: 'mario-walk', frame: 1 },
                { key: 'mario-walk', frame: 0 },
                { key: 'mario-walk', frame: 2 },
            ],
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'walk-hurting',
            frames: [
                { key: 'mario-walk-hurting', frame: 0 },
                { key: 'mario-walk-hurting', frame: 1 },
                { key: 'mario-walk-hurting', frame: 0 },
                { key: 'mario-walk-hurting', frame: 2 },
            ],
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'walk-holding',
            frames: [
                { key: 'mario-walk-holding', frame: 0 },
                { key: 'mario-walk-holding', frame: 1 },
                { key: 'mario-walk-holding', frame: 0 },
                { key: 'mario-walk-holding', frame: 2 },
            ],
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'walk-holding-hurting',
            frames: [
                { key: 'mario-walk-holding-hurting', frame: 0 },
                { key: 'mario-walk-holding-hurting', frame: 1 },
                { key: 'mario-walk-holding-hurting', frame: 0 },
                { key: 'mario-walk-holding-hurting', frame: 2 },
            ],
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'mario-walk', frame: 0 }],

        });

        this.anims.create({
            key: 'idle-holding',
            frames: [{ key: 'mario-walk-holding', frame: 0 }],
        });

        this.anims.create({
            key: 'idle-holding-hurting',
            frames: [{ key: 'mario-walk-holding-hurting', frame: 0 }],
        });

        this.anims.create({
            key: 'idle-hurting',
            frames: [{ key: 'mario-walk-hurting', frame: 0 }],

        });

        this.anims.create({
            key: 'jump',
            frames: [{ key: 'mario-walk', frame: 1 }],
            repeat: -1

        });
        this.anims.create({
            key: 'jump-hurting',
            frames: [{ key: 'mario-walk-hurting', frame: 1 }],
            repeat: -1

        });


        this.anims.create({
            key: 'jump-holding',
            frames: [{ key: 'mario-walk-holding', frame: 1 }],
            repeat: -1

        });

        this.anims.create({
            key: 'jump-holding-hurting',
            frames: [{ key: 'mario-walk-holding-hurting', frame: 1 }],
            repeat: -1

        });

        this.anims.create({
            key: 'pick',
            frames: [{ key: 'mario-pick', frame: 0 }],
            frameRate: 4,
            repeat: 1
        });

        this.anims.create({
            key: 'pick-hurting',
            frames: [{ key: 'mario-pick-hurting', frame: 0 }],
            frameRate: 4,
            repeat: 1
        });


        this.anims.create({
            key: 'duck',
            frames: [{ key: 'mario-duck', frame: 0 }],

            repeat: -1
        });

        this.anims.create({
            key: 'throw',
            frames: [{ key: 'mario-throw', frame: 0 }],
            frameRate: 6,
            repeat: 1
        });

        this.anims.create({
            key: 'dead',
            frames: [{ key: 'mario-dead', frame: 0 }],

            repeat: -1
        });

        this.anims.create({
            key: 'win',
            frames: [{ key: 'mario-win', frame: 0 }],

            repeat: -1
        });

    }

    public isStandingOnEgg(): boolean {
        return this.standingOnEgg.isStandingOnEgg();
    }

    public isPickingEgg(): boolean {
        return this.movement instanceof MarioPickingItem && this.movement.isPickingEgg();
    }

    public isHoldingEgg(): boolean {
        return this.holdingItem.isHoldingEgg();
    }

    public isStandingAtCarrot(): boolean {
        return this.standingAtCarrot.isStandingAtCarrot();
    }

    public isStandingAt(carrot: Carrot): boolean {
        return this.standingAtCarrot.isStandingAt(carrot);
    }


    public isPickingCarrot(): boolean {
        return this.movement instanceof MarioPickingItem && this.movement.isPickingCarrot();
    }

    public isHoldingCarrot(): boolean {
        return this.holdingItem.isHoldingCarrot();
    }

    public isHoldingItem(): boolean {
        return this.holdingItem.isHoldingItem();
    }

    public isPicking() {
        return this.movement instanceof MarioPickingItem
    }

    public isThrowing() {
        return this.movement instanceof MarioThrowingItem;
    }

    public isIdle() {
        return this.movement instanceof MarioIdle;
    }

    public isWalking() {
        return this.movement instanceof MarioWalking;
    }

    public isJumping() {
        return this.movement instanceof MarioJumping;
    }


    startPickingEgg() {
        if (!this.isStandingOnEgg()) throw new Error("Can not pick egg if mario is not standing on one");
        this.movement = new MarioPickingItem({ item: this.standingOnEgg.egg!, type: ItemType.EGG });
    }

    startPickingCarrot() {
        if (!this.isStandingAtCarrot()) throw "Can't pick carrot if Mario isn't standing at one.";
        this.movement = new MarioPickingItem({ item: this.standingAtCarrot.carrot!, type: ItemType.CARROT });
        this.standingAtCarrot.leftCarrot();
    }

    throw(direction?: "right" | "left") {
        if (!this.isHoldingItem()) throw "Can't throw item that Mario isn't holding";

        // Put mario in the correct direction.
        if (direction) {
            this.setFlipX(direction === "left" ? true : false);
        }

        // Throw away item from holding item state.
        this.holdingItem.throw(direction ?? (this.flipX ? "left" : "right"));

        // Update movement to throwing item.
        this.movement = new MarioThrowingItem();
    }

    public jump(direction?: "right" | "left", bigJump: boolean = false) {
        this.movement = new MarioJumping(direction, bigJump);
    }

    public idle(direction?: "right" | "left") {
        this.movement = new MarioIdle(direction);
    }

    public walk(direction?: "right" | "left") {
        this.movement = new MarioWalking(direction);
    }

    public duck() {
        this.movement = new MarioDucking();
    }

    public holdCarrot(carrot: Carrot) {
        this.holdingItem.holdItem({ type: ItemType.CARROT, item: carrot });
    }

    public holdEgg(egg: Egg) {
        this.holdingItem.holdItem({ type: ItemType.EGG, item: egg });
    }

    public set marioMovement(marioMovement: MarioStateUpdate) {
        this.movement = marioMovement;
    }

    public handleOverlap(obj: any) {

        if (!this.standingAtCarrot.isStandingAtCarrot() && obj instanceof Carrot) {
            const carrot = obj;
            const overlapX = Math.min(carrot.x + carrot.width, this.x + this.width) - Math.max(carrot.x, this.x);

            if (overlapX > carrot.width * 0.75 && !this.standingAtCarrot.isStandingAt(carrot) && !this.isPickingCarrot() && !(this.holdingItem.isHoldingThis(carrot)) && !carrot.isThrowed()) {
                this.standingAtCarrot.standAt(carrot);
            }
        }
    }

    public handleCollision(obj: any) {

        if (obj instanceof Egg) {

            const egg = obj;

            if (this.holdingItem.isHoldingThis(egg) || this.isPicking() && (this.movement as MarioPickingItem).isPickingThis(egg)) {
                // Do nothing mario is holding the egg or picking it

            } else if (this.dynamicBody.touching.down && egg.body?.touching.up) {

                if (!this.isStandingOnEgg()) {
                    this.standingOnEgg.standOn(egg);
                }

            } else {

                if (this.fightingScene.state === FightingState.FIGHTING && !this.isHurting) {

                    this.isHurting = true;
                    this.lives -= 1;

                    if (this.lives === 0) {
                        this.fightingScene.state = FightingState.BIRDO_WON;
                        this.fightingScene.sound.play("mario-ouch");
                        if (this.isHoldingItem()) this.holdingItem.drop(this.flipX ? "left" : "right")


                    } else {
                        this.fightingScene.sound.play("mario-ouch");
                    }
                }

            }
        }
        else if (obj instanceof Birdo) {
            if (this.fightingScene.state === FightingState.FIGHTING && !this.isHurting) {

                this.lives -= 1;
                this.isHurting = true;

                if (this.lives === 0) {
                    this.fightingScene.state = FightingState.BIRDO_WON;
                    this.fightingScene.sound.play("mario-ouch");

                    if (this.isHoldingItem()) this.holdingItem!.drop(this.flipX ? "left" : "right")

                } else {
                    this.fightingScene.sound.play("mario-ouch");
                }

            }

        }
    }

    private updateState(cursors: any) {

        this.updateIsHurting();

        if (!this.isJumping() && !this.isThrowing() && !this.isPicking()) this.tree.evaluate(); /* this.updateStateBasedOnCursors(cursors); */

        this.movement.update(this);

        if (this.isHoldingItem()) this.holdingItem.update(this);
        if (this.isStandingOnEgg()) this.standingOnEgg.update(this);
        if (this.isStandingAtCarrot()) this.standingAtCarrot.update(this);

    }

    private updateIsHurting() {
        if (this.isHurting) {
            this.counter++;
            if (this.counter >= 50) {
                this.isHurting = false;
                this.counter = 0;
            };
        }
    }

    private updateStateBasedOnCursors(cursors: any) {

        if (cursors.up.isDown && this.isHoldingItem()) {
            this.throw();
        }
        else if (cursors.space.isDown && this.dynamicBody.blocked.down) {
            this.jump(cursors.left.isDown ? "left" : cursors.right.isDown ? "right" : undefined, true);
        }
        else if (cursors.left.isDown && !this.isJumping()) {
            this.walk("left");
        } else if (cursors.right.isDown && !this.isJumping()) {
            this.walk("right");
        }
        else if (cursors.down.isDown && this.isStandingOnEgg() && !this.isHoldingItem()) {
            this.startPickingEgg();
        } else if (cursors.down.isDown && this.isStandingAtCarrot() && !this.isHoldingItem()) {
            this.startPickingCarrot();
        }
        else if (cursors.down.isDown && !this.isHoldingItem()) {
            this.duck();
        }
        else {
            if (!(this.isJumping() && !this.dynamicBody.blocked.down)) this.idle();
        }
    }

    private drawHearts() {
        this.livesGroup.clear(true);

        for (let l = 0; l < this.lives; ++l) {
            this.livesGroup.add(this.fightingScene.add.image(320 - 16 - 4, 4 + l * 16, "heart").setOrigin(0, 0))
        }
    }

    /**
     * Updates mario's state according to fighting state.
     */
    public update(cursors: any) {

        switch (this.fightingScene.state) {
            case FightingState.INTRO:
                this.idle("right");
                this.lives = 3;
                break;
            case FightingState.FIGHTING:
                this.updateState(cursors);
                break;
            case FightingState.MARIO_WON:
                if (!this.soundWon.isPlaying) {
                    this.soundWon.play();

                    this.soundWon.addListener("complete", () => {
                        this.fightingScene.scene.start("MainMenu");
                    });
                }

                this.play("win");
                this.setVelocity(0, !this.dynamicBody.blocked.down ? 1000 : 0); // Get mario back down if up
                this.adjustHeight(32);
                break;
            case FightingState.BIRDO_WON:
                this.play("dead");
                this.adjustHeight(32);
                this.setVelocity(0, !this.dynamicBody.blocked.down ? 1000 : 0); // Get mario back down if up
                break;
        }

        this.drawHearts();
    }


    /**
     * Adjust height of Mario.
     * The height differs in different states, e.g. ducking vs. walking. 
     * If the new height is already set, nothing happens.  
     * @param newHeight the new height of mario. 
     */
    public adjustHeight(newHeight: number): void {
        if (this.dynamicBody.height !== newHeight) {
            const prevHeight = this.dynamicBody.height;
            this.setSize(24, newHeight);
            this.setOrigin(0);
            this.setPosition(this.x, this.y + prevHeight - newHeight);
        }
    }

}
