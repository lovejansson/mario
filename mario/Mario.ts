import AssetManager from "../AssetManager";
import { GameObject, Collision, CollisionBox, Point, GameState } from "../types";
import { Egg, EggState } from "../Egg";
import { gameState, setGameState } from "../globalState";
import { Platform } from "../Platform";
import AudioPlayer from "../AudioPlayer";
import MarioBehaviourTree from "./MarioBehaviourTree";
import { MarioDamageState, MarioDyingState, MarioFallingState, MarioHoldingItemState, MarioIdleState, MarioJumpingState, MarioStandingOnEggState, MarioState, MarioThrowingItemState, MarioWalkingState, MarioWinningState } from "./MarioState";


export const MARIO_STARTING_POS: Point = { y: 148 - 48, x: -6 };


export class Mario implements GameObject {

    id: string;
    direction: "right" | "left";
    pos: Point;
    vel: Point;
    asset: HTMLImageElement | null;
    lives: number;
    type: string;

    movingState: MarioState;
    itemState: MarioState | null;
    damageState: MarioState | null;
    standingOnEggState: MarioStandingOnEggState | null;
    collisionHandler: MarioCollisionsHandler;
    isStandingOnPlatform: boolean;
    marioBehaviourTree: MarioBehaviourTree;


    constructor() {
        this.id = "mario";
        this.type = "mario";
        this.lives = 3;
        this.pos = { ...MARIO_STARTING_POS };
        this.vel = { x: 0, y: 0 };
        this.asset = null;
        this.direction = "right";
        this.movingState = new MarioIdleState(); // MarioWalkingState, MarioIdleState, MarioPickingItemState, MarioJumpState, MarioFallingState ---> Can only do one thing at a time
        this.itemState = null; // ---> MarioHoldingItemState, MarioThrowingItemState ---> can do either of these at a time. Mario can at the same time walk, stand still, jump or fall. 
        this.damageState = null; // --> Can be taking damage or not, will animate a flickering whiteish image 
        this.standingOnEggState = null; // --> Can be standing on egg or not, will update marios x and y pos according to the eggs vel
        this.collisionHandler = new MarioCollisionsHandler();
        this.isStandingOnPlatform = false;
        this.marioBehaviourTree = new MarioBehaviourTree(this);
    }


    hasDied() {
        return !(this.movingState instanceof MarioDyingState)
    }

    init() {
        const assetHandler = AssetManager.getInstance();

        assetHandler.register("heart", "./assets/images/heart.png");

        assetHandler.register("walk-right1", "./assets/images/mario-walk-right1.png");
        assetHandler.register("walk-right2", "./assets/images/mario-walk-right2.png");
        assetHandler.register("walk-right3", "./assets/images/mario-walk-right3.png");
        assetHandler.register("walk-right4", "./assets/images/mario-walk-right4.png");
        assetHandler.register("walk-right-damage1", "./assets/images/mario-walk-right-damage1.png");
        assetHandler.register("walk-right-damage2", "./assets/images/mario-walk-right-damage2.png");
        assetHandler.register("walk-right-damage3", "./assets/images/mario-walk-right-damage3.png");
        assetHandler.register("walk-right-damage4", "./assets/images/mario-walk-right-damage4.png");

        assetHandler.register("walk-left1", "./assets/images/mario-walk-left1.png");
        assetHandler.register("walk-left2", "./assets/images/mario-walk-left2.png");
        assetHandler.register("walk-left3", "./assets/images/mario-walk-left3.png");
        assetHandler.register("walk-left4", "./assets/images/mario-walk-left4.png");

        assetHandler.register("walk-left-damage1", "./assets/images/mario-walk-left-damage1.png");
        assetHandler.register("walk-left-damage2", "./assets/images/mario-walk-left-damage2.png");
        assetHandler.register("walk-left-damage3", "./assets/images/mario-walk-left-damage3.png");
        assetHandler.register("walk-left-damage4", "./assets/images/mario-walk-left-damage4.png");

        assetHandler.register("lift", "./assets/images/mario-lift.png");

        assetHandler.register("lift-damage", "./assets/images/mario-lift-damage.png");

        assetHandler.register("walk-right-holding-item1", "./assets/images/mario-walk-right-holding-item1.png");
        assetHandler.register("walk-right-holding-item2", "./assets/images/mario-walk-right-holding-item2.png");
        assetHandler.register("walk-right-holding-item3", "./assets/images/mario-walk-right-holding-item3.png");
        assetHandler.register("walk-right-holding-item4", "./assets/images/mario-walk-right-holding-item4.png");


        assetHandler.register("walk-right-holding-item-damage1", "./assets/images/mario-walk-right-holding-item-damage1.png");
        assetHandler.register("walk-right-holding-item-damage2", "./assets/images/mario-walk-right-holding-item-damage2.png");
        assetHandler.register("walk-right-holding-item-damage3", "./assets/images/mario-walk-right-holding-item-damage3.png");
        assetHandler.register("walk-right-holding-item-damage4", "./assets/images/mario-walk-right-holding-item-damage4.png");

        assetHandler.register("walk-left-holding-item1", "./assets/images/mario-walk-left-holding-item1.png");
        assetHandler.register("walk-left-holding-item2", "./assets/images/mario-walk-left-holding-item2.png");
        assetHandler.register("walk-left-holding-item3", "./assets/images/mario-walk-left-holding-item3.png");
        assetHandler.register("walk-left-holding-item4", "./assets/images/mario-walk-left-holding-item4.png");


        assetHandler.register("walk-left-holding-item-damage1", "./assets/images/mario-walk-left-holding-item-damage1.png");
        assetHandler.register("walk-left-holding-item-damage2", "./assets/images/mario-walk-left-holding-item-damage2.png");
        assetHandler.register("walk-left-holding-item-damage3", "./assets/images/mario-walk-left-holding-item-damage3.png");
        assetHandler.register("walk-left-holding-item-damage4", "./assets/images/mario-walk-left-holding-item-damage4.png");


        assetHandler.register("throw-left", "./assets/images/mario-throw-left.png");
        assetHandler.register("throw-right", "./assets/images/mario-throw-right.png");

        assetHandler.register("winning", "./assets/images/mario-win.png");

        assetHandler.register("dead-right", "./assets/images/mario-dead-right.png");
        assetHandler.register("dead-right-damage", "./assets/images/mario-dead-right-damage.png");
        assetHandler.register("dead-left", "./assets/images/mario-dead-left.png");
        assetHandler.register("dead-left-damage", "./assets/images/mario-dead-left-damage.png");


        const audioHandler = AudioPlayer.getInstance();

        audioHandler.createAudio("mario-throw", "./assets/audio/mario-throw.ogg");
        audioHandler.createAudio("mario-picking", "./assets/audio/mario-picking.ogg");
        audioHandler.createAudio("mario-picked", "./assets/audio/mario-picked.ogg");
        audioHandler.createAudio("mario-ouch", "./assets/audio/mario-ouch.ogg");
        audioHandler.createAudio("mario-jump", "./assets/audio/mario-jump.ogg");

    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y + 16, x: this.pos.x + 8, w: 20, h: 32 }
    }

    update(elapsedMillis: number, collisions: Collision[]) {

        switch (gameState) {
            case GameState.FIGHTING:
                if (this.lives === 0) {
                    if (this.itemState instanceof MarioHoldingItemState) {
                        this.itemState.dropEgg(this);
                    }
                    this.movingState = new MarioDyingState();
                    setGameState(GameState.BIRDO_WON);
                    this.movingState.update(this, elapsedMillis);

                    break;
                }

                this.collisionHandler.update(elapsedMillis, this, collisions);

                this.marioBehaviourTree.evaluate();

                if (this.standingOnEggState !== null) {
                    this.standingOnEggState.update(this, elapsedMillis)
                }

                if (this.itemState !== null) {
                    this.itemState.update(this, elapsedMillis);
                }

                if (this.damageState !== null) {
                    this.damageState.update(this, elapsedMillis)
                }

                this.movingState.update(this, elapsedMillis);

                break;
            case GameState.MARIO_WON:
                if (!(this.movingState instanceof MarioWinningState)) {
                    this.movingState = new MarioWinningState()
                }
                this.movingState.update(this, elapsedMillis);

                break;
            case GameState.BIRDO_WON:
                this.movingState.update(this, elapsedMillis);

                break;
            case GameState.INTRO:
                this.movingState.update(this, elapsedMillis);

                this.direction = "right";
                this.lives = 3;
                this.pos.x = MARIO_STARTING_POS.x;
                this.pos.y = MARIO_STARTING_POS.y;
                break;
            case GameState.PAUSE:
                this.movingState = new MarioIdleState();
                this.direction = "right";
                this.pos.x = MARIO_STARTING_POS.x;
                this.pos.y = MARIO_STARTING_POS.y;
                break;
        }

    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.asset === null) throw "Asset is null, should not happen";

        for (let l = 0; l < this.lives; ++l) {
            ctx.drawImage(AssetManager.getInstance().get("heart"), 304 - l * 16, 0);
        }

        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

}


/**
 * This class checks for collisions and updates marios state. 
 */
export class MarioCollisionsHandler {

    update(elapsedMillis: number, mario: Mario, collisions: Collision[]) {

        let isStandingOnEgg = false;
        let isStandingOnPlatform = false;

        for (const collision of collisions) {

            // if mario jumps onto an egg
            if (collision.obj instanceof Egg && collision.collisionPoint === "south" && [EggState.FLYING, EggState.PICKED].includes(collision.obj.state)) {

                if (mario.standingOnEggState === null) {
                    mario.standingOnEggState = new MarioStandingOnEggState(collision.obj);
                    mario.pos.y = mario.standingOnEggState.getEgg().pos.y - 47; // Initialize mario y to egg
                    mario.movingState = new MarioIdleState();
                }

                isStandingOnEgg = true;

                // If mario jumps onto the platform
            } else if (collision.obj instanceof Platform && collision.collisionPoint === "south" && mario.vel.y >= 0) {

                if (!mario.isStandingOnPlatform) {

                    mario.pos.y = collision.obj.pos.y - 48; // 50 - 48
                    mario.isStandingOnPlatform = true;
                    if (mario.movingState instanceof MarioJumpingState) {
                        mario.movingState = new MarioIdleState();
                    }


                }

                isStandingOnPlatform = true;
                if (mario.movingState instanceof MarioJumpingState) {
                    mario.movingState = new MarioIdleState();
                }

            } else if (collision.obj instanceof Platform) {
                // let mario jump through
            }
            // If not throwing or holding the egg that mario is colliding with, or is already taking damage, he will take damage
            else if (!(collision.obj instanceof Egg && (mario.itemState instanceof MarioHoldingItemState && (mario.itemState as MarioHoldingItemState).getEgg() === collision.obj) || (mario.itemState instanceof MarioThrowingItemState &&
                (mario.itemState as MarioThrowingItemState).getEgg() == collision.obj
            ) || mario.damageState !== null)) {

                mario.damageState = new MarioDamageState(elapsedMillis);
                mario.lives -= 1;
            }
        }


        if (mario.isStandingOnPlatform && !isStandingOnPlatform) {

            mario.isStandingOnPlatform = false;

            // Let mario fall down from egg if he walked away from it
            if (mario.movingState instanceof MarioWalkingState) {
                mario.movingState = new MarioFallingState();
            }
        }

        if (mario.standingOnEggState !== null && !isStandingOnEgg) {

            mario.standingOnEggState = null;
            // Let mario fall down from egg if he walked away from it
            if (mario.movingState instanceof MarioWalkingState) {
                mario.movingState = new MarioFallingState();
            }
        }

    }
}
