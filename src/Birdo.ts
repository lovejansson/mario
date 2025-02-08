import { Carrot } from "./Carrot";
import { Egg } from "./Egg";
import { Fighting, FightingState, PLATFORM_BIRDO_POS, PLATFORM_BIRDO_WIDTH } from "./scenes/Fighting";

enum BirdoState {
    WALK_FORWARD,
    WALK_BACKWARDS,
    SHOOT_EGG,
    JUMP,
    IDLE,
}

export const BIRDO_WIDTH = 27;

export const BIRDO_HEIGHT = 46;

type PhaserSound = Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;

export class Birdo extends Phaser.Physics.Arcade.Sprite {

    private dynamicBody: Phaser.Physics.Arcade.Body;
    state: BirdoState;
    prevState: BirdoState;

    private counter: number;
    private hasShootEgg: boolean;
    private hasJumped: boolean;

    private lives: number;
    private isHurting: boolean;
    private isHurtingCounter: number;

    private soundHurting: PhaserSound;
    private soundIntro: PhaserSound;
    private soundShoot: PhaserSound;
    private soundWon: PhaserSound;

    private fightingScene: Fighting;


    constructor(scene: Fighting, x: number, y: number, texture: string,) {
        super(scene, x, y, texture);

        // Enable physics on this sprite
        scene.physics.add.existing(this);

        // Add the sprite to the scene
        scene.add.existing(this);

        this.dynamicBody = this.body as Phaser.Physics.Arcade.Body;

        this.fightingScene = this.scene as Fighting;

        this.state = BirdoState.WALK_FORWARD;
        this.prevState = BirdoState.WALK_FORWARD

        this.lives = 5;
        this.isHurting = false;

        this.counter = 0;
        this.isHurtingCounter = 0;
        this.hasShootEgg = false;
        this.hasJumped = false;


        // Set body properties

        // So that birdo will not gain any velocity when getting hit by carrots or eggs
        this.setPushable(false); // Sets birdo to be non pushable 
        this.dynamicBody.setSlideFactor(0, 0)

        this.setSize(BIRDO_WIDTH, BIRDO_HEIGHT);
        this.setOrigin(0);

        this.refreshBody();

        // Create animations

        this.anims.create({
            key: 'walk',
            frames: [{ key: 'birdo-walk', frame: 0 }, { key: 'birdo-walk', frame: 1 }],
            frameRate: 10,
            repeat: -1, // Loop the animation (-1 means infinite)
        });

        this.anims.create({
            key: 'shoot',
            frames: [{ key: 'birdo-shoot', frame: 0 }],
            repeat: -1,  // Loop the animation (-1 means infinite)
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'birdo-idle', frame: 0 }],
            repeat: -1,  // Loop the animation (-1 means infinite)
        });


        this.anims.create({
            key: 'walk-hurting',
            frames: [{ key: 'birdo-walk-hurting', frame: 0 }, { key: 'birdo-walk-hurting', frame: 1 }],
            frameRate: 10,
            repeat: -1, // Loop the animation (-1 means infinite)
        });

        this.anims.create({
            key: 'shoot-hurting',
            frames: [{ key: 'birdo-shoot-hurting', frame: 0 }],
            repeat: -1,  // Loop the animation (-1 means infinite)
        });

        this.anims.create({
            key: 'idle-hurting',
            frames: [{ key: 'birdo-idle-hurting', frame: 0 }],
            repeat: -1,  // Loop the animation (-1 means infinite)
        });

        this.soundHurting = this.fightingScene.sound.add('birdo-hurting');
        this.soundIntro = this.fightingScene.sound.add('birdo-intro');

        this.soundShoot = this.fightingScene.sound.add('birdo-shoot-egg');
        this.soundWon = this.fightingScene.sound.add("birdo-won");
    }


    handleCollision(obj: any) {

        if (!this.isHurting && this.fightingScene.state === FightingState.FIGHTING) {
            if (obj instanceof Egg || obj instanceof Carrot) {

                this.lives -= 1;
                if (this.lives === 0) {
                    this.fightingScene.state = FightingState.MARIO_WON;
                } else {
                    this.soundHurting.play();
                }
            }

            this.isHurting = true;
        }
    }

    idle() {
        if (this.isHurting) {
            this.play("idle-hurting", true);
        } else {
            this.play("idle", true);
        }

        this.setVelocityX(0);
        this.setVelocityY(0);

    }

    jump() {

        if (this.isHurting) {
            this.play("idle-hurting", true);
        } else {
            this.play("idle", true);
        }

        this.setVelocityX(0);
        this.setVelocityY(-150);
    }


    walk(direction: "right" | "left") {

        if (this.isHurting) {
            this.play("walk-hurting", true);
        } else {
            this.play("walk", true);
        }

        this.setVelocityX(direction === "right" ? 40 : -40);
        this.setVelocityY(0);

    }

    shootEgg() {

        const eggWidth = 18;
        const egg = new Egg(this.fightingScene, this.flipX ? this.dynamicBody.x + BIRDO_WIDTH - 2 : this.dynamicBody.x - eggWidth, this.dynamicBody.y + 4, "egg", this.flipX ? "right" : "left");
        this.fightingScene.addEgg(egg);

        this.soundShoot.play();

        if (this.isHurting) {
            this.play("shoot-hurting", true);
        } else {
            this.play("shoot", true);
        }

        this.setVelocityX(0);
        this.setVelocityY(0);
    }

    update(_: any) {

        switch (this.fightingScene.state) {

            case FightingState.INTRO:

                this.anims.play("idle");

                if (!this.soundIntro.isPlaying) {
                    console.log("BIRDO INTRO SOUND")
                    this.soundIntro.play();

                    this.soundIntro.on("complete", () => {
                        this.fightingScene.state = FightingState.FIGHTING;
                    });
                }

                this.lives = 5;
                break;
            case FightingState.FIGHTING:
                this.updateFighting()
                break;
            case FightingState.MARIO_WON:

                this.state = BirdoState.IDLE;
                if (this.isHurting) {
                    this.play("idle-hurting", true);
                } else {
                    this.play("idle", true);
                }

                this.setVelocityX(0);
                this.setVelocityY(0);
                break;
            case FightingState.BIRDO_WON:
                this.anims.play("idle");
                if (!this.soundWon.isPlaying) {
                    this.soundWon.play();

                    this.soundWon.addListener("complete", () => {
                        this.fightingScene.scene.start("MainMenu");
                    });
                }

                break;
        }

    }

    updateFighting() {

        // Check isHurting state

        if (this.isHurting) {
            this.isHurtingCounter++;
        }

        if (this.isHurtingCounter >= 50) {
            this.isHurting = false;
            this.isHurtingCounter = 0;
        };

        const marioX = this.fightingScene.mario.x;


        if (marioX <= this.x) {
            this.setFlipX(false);
        } else {
            this.setFlipX(true);
        }

        switch (this.state) {

            case BirdoState.WALK_FORWARD:
                {
                    const hasReachedTurningPoint = (this.flipX && this.dynamicBody.position.x >= PLATFORM_BIRDO_POS.x + PLATFORM_BIRDO_WIDTH / 2 - BIRDO_WIDTH) || (!this.flipX && this.dynamicBody.position.x <= PLATFORM_BIRDO_POS.x + PLATFORM_BIRDO_WIDTH / 2);

                    if (hasReachedTurningPoint) {
                        this.state = BirdoState.SHOOT_EGG;
                        this.idle();

                    } else {
                        this.walk(this.flipX ? "right" : "left");
                    }

                    break;
                }

            case BirdoState.WALK_BACKWARDS:
                {

                    const hasReachedTurningPoint = (this.flipX && this.dynamicBody.position.x <= PLATFORM_BIRDO_POS.x) || (!this.flipX && this.dynamicBody.position.x >= PLATFORM_BIRDO_POS.x + PLATFORM_BIRDO_WIDTH - BIRDO_WIDTH);

                    if (hasReachedTurningPoint) {
                        this.state = BirdoState.JUMP;
                        this.idle();
                    } else {
                        this.walk(this.flipX ? "left" : "right");
                    }

                    break;
                }
            case BirdoState.SHOOT_EGG:
                {
                    if (this.counter >= 25 && !this.hasShootEgg) {
                        this.shootEgg();
                        this.hasShootEgg = true;
                    }

                    if (this.isHurting) {
                        this.play("shoot-hurting", true);
                    } else {
                        this.play("shoot", true);
                    }


                    this.counter++;

                    if (this.counter >= 100) {
                        this.state = BirdoState.WALK_BACKWARDS;
                        this.counter = 0;
                        this.hasShootEgg = false;
                    }

                    break;

                }

            case BirdoState.JUMP:
                {
                    if (this.hasJumped && this.dynamicBody?.blocked.down) {
                        this.state = BirdoState.IDLE;
                        this.hasJumped = false;
                        break;
                    }

                    if (!this.hasJumped) {
                        this.jump();
                        this.hasJumped = true;
                    }

                    break;
                }

            case BirdoState.IDLE:
                {
                    this.idle();

                    this.counter++;

                    if (this.counter >= 100) {
                        this.state = BirdoState.WALK_FORWARD;
                        this.counter = 0;
                    }
                }

        }

    }

}