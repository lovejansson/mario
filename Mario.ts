import AssetManager from "./AssetManager";
import { GameObject, Collision, CollisionBox, Point, GameState } from "./types";
import { Egg, EggState } from "./Egg";
import { Birdo } from "./Birdo";
import { AndBranch, Leaf, OrBranch, TreeNode } from "./BehaviourTree";
import { gameObjects, gameState, setGameState } from "./globalState";
import { isOutsideOf, sample } from "./utils";
import { Platform } from "./Platform";
import AudioPlayer from "./AudioPlayer";


const MARIO_STARTING_POS: Point = { y: 148 - 48, x: -6 };

interface MarioState {
    update: (mario: Mario, elapsedMillis: number) => void;
}


/**
 * Mario's idle state. 
 * 
 * Transitions: 
 * - Press a/d -> MarioWalkingState
 * - Press s && has collision with egg below him -> MarioPickingState
 * - Press space -> MarioJumpingState
 */
class MarioIdleState implements MarioState {
    flipFlop: boolean;


    constructor() {
        this.flipFlop = true;

    }

    update(mario: Mario, _: number) {
        mario.asset = this.getAsset(mario);
        mario.vel.x = 0;
        mario.vel.y = 0;


    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetManager.getInstance();

        if (mario.damageState instanceof MarioDamageState) {
            this.flipFlop = !this.flipFlop;

            return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${this.flipFlop ? "-damage" : ""}1`);
        } else {
            return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}1`);
        }
    }
}

/**
 * Mario's taking damage state. 
 * 
 * Transitions
 *  - no transitions, can be in damage state when doing other stuff
 */
class MarioDamageState implements MarioState {

    private prevMillis: number;
    private elapsedMillisDiff: number;

    constructor(elapsedMillis: number,) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillisDiff = 0;

        AudioPlayer.getInstance().playAudio("mario-ouch")
    }

    update(mario: Mario, elapsedMillis: number) {
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        if (this.elapsedMillisDiff >= 500) {
            mario.damageState = null;
        }

    }

}

/** 
* Mario's walking state.
* 
* Transitions: 
* - Release a/d -> MarioIdleState
* - Press space -> MarioJumpingState
* - Press s && has collision with egg below him -> MarioPickingState
*/
class MarioWalkingState implements MarioState {

    private prevMillis: number | null;
    private elapsedMillisDiff: number;
    private totalElapsedMillis: number;
    private walkFrame: 0 | 1 | 2 | 3;
    private flipFlop: boolean;

    constructor() {
        this.prevMillis = null;
        this.walkFrame = 0;
        this.elapsedMillisDiff = 0;
        this.totalElapsedMillis = 0;
        this.flipFlop = true;
    }

    update(mario: Mario, elapsedMillis: number) {

        if (mario.direction === "left") {
            mario.vel.x = -1;
        } else if (mario.direction === "right") {
            mario.vel.x = 1;
        } else {
            mario.vel.x = 0;
        }

        // Update according to player controls

        mario.pos.x += mario.vel.x;
        mario.pos.y += mario.vel.y;

        this.updateFrame(elapsedMillis);
        mario.asset = this.getAsset(mario);
    }

    getElapsedMillis() {

        return this.totalElapsedMillis;
    }

    private getAsset(mario: Mario) {

        const assetHandler = AssetManager.getInstance();

        if (mario.damageState instanceof MarioDamageState) {
            this.flipFlop = !this.flipFlop;
            return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${this.flipFlop ? "-damage" : ""}${this.walkFrame + 1}`);
        }

        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${this.walkFrame + 1}`);
    }


    private updateFrame(elapsedMillis: number) {
        // Change sprite frame every 150 ms
        if (this.prevMillis === null) {
            this.elapsedMillisDiff = 0;
            this.totalElapsedMillis = 0;
            this.prevMillis = elapsedMillis;
        } else {
            this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
            this.totalElapsedMillis += (elapsedMillis - this.prevMillis)
            this.prevMillis = elapsedMillis;

        }

        if (this.elapsedMillisDiff >= 150) {
            this.nextWalkFrame();
            this.elapsedMillisDiff = 0;
        }
    }

    private nextWalkFrame() {
        this.walkFrame = this.walkFrame === 3 ? 0 : this.walkFrame + 1 as (0 | 1 | 2 | 3);
    }

}

/** 
* Mario's jumping state.
* 
* Transitions: 
* - After jump is done -> MarioIdleState
*/
class MarioJumpingState implements MarioState {

    private flipFlop: boolean;

    constructor() {
        this.flipFlop = true;
        AudioPlayer.getInstance().playAudio("mario-jump");
    }

    update(mario: Mario, _: number) {

        mario.vel.x = mario.direction === "right" ? 1 : -1;
        mario.asset = this.getAsset(mario);

        // Determine velocity y

        const g = 1;
        const vi = -14;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
        mario.vel.y = vi + (g * mario.movingStateCounter.frames);


        const marioPosY = mario.pos.y + mario.vel.y;

        if (marioPosY > MARIO_STARTING_POS.y) {

            // Jump is done
            mario.movingState = new MarioIdleState();
            mario.pos.y = MARIO_STARTING_POS.y;
            mario.vel.y = 0;

        } else {
            mario.pos.y = marioPosY;

        }

        mario.pos.x += mario.vel.x;

    }

    private getAsset(mario: Mario) {

        const assetHandler = AssetManager.getInstance();

        if (mario.damageState instanceof MarioDamageState) {
            this.flipFlop = !this.flipFlop;
            return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${this.flipFlop ? "-damage" : ""}2`);
        }

        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}2`);

    }
}

/**
 * Mario's falling state. 
 * 
 * Transitions: 
 * - After falling is done -> MarioIdleState
 */
class MarioFallingState implements MarioState {
    frame: number;

    constructor() {

        this.frame = 0;
    }

    update(mario: Mario, _: number) {

        mario.asset = this.getAsset(mario)

        const vi = 0;
        const g = 1;

        mario.vel.y = vi + (g * this.frame);

        const marioPosY = mario.pos.y + mario.vel.y;


        if (marioPosY > MARIO_STARTING_POS.y) {
            // Falling is done

            mario.pos.x += mario.vel.x;
            mario.pos.y = MARIO_STARTING_POS.y;
            mario.vel.y = 0;
            mario.vel.x = 0;

            mario.movingState = new MarioWalkingState();
        } else {
            mario.pos.y = marioPosY;
            mario.pos.x += mario.vel.x;
            this.frame++;
        }

    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetManager.getInstance();
        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${mario.damageState instanceof MarioDamageState ? "-damage" : ""}2`);

    }
}

class MarioPickingState implements MarioState {

    private prevMillis: number | null;
    private elapsedMillisDiff: number;

    constructor() {
        this.prevMillis = null;
        this.elapsedMillisDiff = 0;
        AudioPlayer.getInstance().playAudio("mario-picking");

    }

    update(mario: Mario, elapsedMillis: number) {

        mario.asset = this.getAsset(mario);


        if (this.prevMillis === null) {
            this.prevMillis = elapsedMillis;
        } else {
            // Change to Holding item state after 500 ms
            this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
            this.prevMillis = elapsedMillis;
        }



        if (this.elapsedMillisDiff >= 1000 && mario.standingOnEggState) {

            const egg = mario.standingOnEggState.getEgg();

            mario.standingOnEggState = null;
            mario.movingState = new MarioFallingState();
            mario.itemState = new MarioHoldingItemState(elapsedMillis, egg);
            AudioPlayer.getInstance().playAudio("mario-picked");

        }
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetManager.getInstance();
        return mario.damageState !== null ? assetHandler.get("lift-damage") : assetHandler.get("lift");
    }
}

class MarioHoldingItemState implements MarioState {

    private egg: Egg;
    private yDiff: number;
    private prevMillis: number;
    private elapsedMillisDiff: number;

    constructor(elapsedMillis: number, egg: Egg) {
        this.egg = egg;

        egg.hold(); // will prevent egg from updating its position, it now belongs to mario. 
        this.yDiff = 1;
        this.elapsedMillisDiff = 0;
        this.prevMillis = elapsedMillis;

    }

    update(mario: Mario, elapsedMillis: number) {

        this.egg.pos.x = mario.pos.x + 8;
        this.egg.pos.y = mario.pos.y + this.yDiff;

        if (mario.movingState instanceof MarioWalkingState) {

            this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
            this.prevMillis = elapsedMillis;

            if (this.elapsedMillisDiff >= 150) {
                this.elapsedMillisDiff = 0;
                this.yDiff *= -1;
            }

        } else if (mario.movingState instanceof MarioJumpingState) {
            this.elapsedMillisDiff = 0;
            this.yDiff = -1;
            this.prevMillis = elapsedMillis;
        }
        else {
            this.elapsedMillisDiff = 0;
            this.yDiff = 1;
            this.prevMillis = elapsedMillis;
        }
    }

    throwEgg(mario: Mario) {
        mario.itemState = new MarioThrowingItemState(this.egg);
        this.egg.throw(mario.direction);
    }

    dropEgg(mario: Mario) {
        mario.itemState = null;
        this.egg.drop();
    }

    getEgg() {
        return this.egg;
    }
}

/**
 * Vill basically just keep information about the egg that mario could be standing on
 * 
 */
class MarioStandingOnEggState implements MarioState {
    private egg: Egg;

    constructor(egg: Egg) {
        this.egg = egg;
    }

    getEgg() {
        return this.egg;
    }

    update(mario: Mario, _: number) {
        // Update according to moving egg
        mario.pos.y += this.egg.vel.y;
        mario.pos.x += this.egg.vel.x;
    }
}

class MarioThrowingItemState implements MarioState {
    private prevMillis: number | null;
    private elapsedMillisDiff: number;
    private egg: Egg;

    constructor(egg: Egg) {
        this.prevMillis = null;
        this.elapsedMillisDiff = 0;
        this.egg = egg;

        const audioHandler = AudioPlayer.getInstance();

        audioHandler.playAudio("mario-throw");
    }

    update(mario: Mario, elapsedMillis: number) {

        mario.asset = this.getAsset(mario);

        if (this.prevMillis === null) {
            this.prevMillis = elapsedMillis;
        } else {
            // Update millis diff
            this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
            this.prevMillis = elapsedMillis;
        }


        // Will keep mario in a throwing state until 500 ms has elapsed
        if (this.elapsedMillisDiff >= 250) {
            mario.itemState = null;
        }
    }

    getEgg() {
        return this.egg;
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetManager.getInstance();
        return mario.direction === "left" ? assetHandler.get("throw-left") : assetHandler.get("throw-right");
    }
}

export class MarioDyingState implements MarioState {
    flipFlop: boolean;
    frame: number;


    constructor() {
        this.flipFlop = true;
        this.frame = 0;

    }

    update(mario: Mario,) {

        mario.asset = this.getAsset(mario)

        const vi = 0;
        const g = 0.2;

        mario.vel.y = vi + (g * this.frame);


        const marioPosY = mario.pos.y + mario.vel.y;
        this.flipFlop = !this.flipFlop;

        mario.vel.x = -1;

        // Has fallen off screen
        if (marioPosY > 2000) {
            mario.pos.y = MARIO_STARTING_POS.y;
            mario.pos.x = MARIO_STARTING_POS.x;
            mario.vel.y = 0;
            mario.vel.x = 0;

            if (mario.standingOnEggState !== null) mario.standingOnEggState = null;

            setGameState(GameState.FIGHTING);
            mario.movingState = new MarioIdleState();
            mario.lives = 5;
        } else {
            mario.pos.y = marioPosY;
            mario.pos.x += mario.vel.x;
            this.frame += 1;
        }

    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetManager.getInstance();

        return assetHandler.get(`dead-${mario.direction}${this.flipFlop ? "-damage" : ""}`);
    }
}

export class MarioWinningState implements MarioState {

    update(mario: Mario, _: number) {

        mario.asset = this.getAsset();

        if (gameState === GameState.FIGHTING) {
            mario.movingState = new MarioIdleState();
            mario.lives = 5;
        }
    }

    private getAsset() {
        const assetHandler = AssetManager.getInstance();
        return assetHandler.get("winning");
    }
}


/**
 * This class checks for collisions and updates marios state. 
 */
class MarioCollisionsHandler {

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

class Counter {
    frames: number = 0;

    tick() {
        this.frames++;
    }

    reset() {
        this.frames = 0;
    }

}

export class Mario implements GameObject {

    id: string;
    direction: "right" | "left";
    pos: Point;
    vel: Point;
    asset: HTMLImageElement | null;
    lives: number;

    private _movingState: MarioState;
    itemState: MarioState | null;
    damageState: MarioState | null;
    standingOnEggState: MarioStandingOnEggState | null;
    collisionHandler: MarioCollisionsHandler;
    behaviourTree: TreeNode | null;
    actionIsRunning: boolean;
    movingStateCounter: Counter;
    isStandingOnPlatform: boolean;



    constructor() {
        this.id = "mario";
        this.lives = 5;
        this.pos = { ...MARIO_STARTING_POS };
        this.vel = { x: 0, y: 0 };
        this.asset = null;
        this.direction = "right";
        this._movingState = new MarioIdleState(); // MarioWalkingState, MarioIdleState, MarioPickingItemState, MarioJumpState, MarioFallingState ---> Can only do one thing at a time
        this.itemState = null; // ---> MarioHoldingItemState, MarioThrowingItemState ---> can do either of these at a time. Mario can at the same time walk, stand still, jump or fall. 
        this.damageState = null; // --> Can be taking damage or not, will animate a flickering whiteish image 
        this.standingOnEggState = null; // --> Can be standing on egg or not, will update marios x and y pos according to the eggs vel
        this.collisionHandler = new MarioCollisionsHandler();
        this.behaviourTree = null;
        this.actionIsRunning = false;
        this.movingStateCounter = new Counter();
        this.isStandingOnPlatform = false;
    }

    get movingState() {
        return this._movingState;
    }

    set movingState(newState: MarioState) {

        this.movingStateCounter.reset();
        this._movingState = newState;
    }

    hasDied() {
        return !(this._movingState instanceof MarioDyingState)
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

        this.behaviourTree = this.createBehaviourTree();

    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y + 16, x: this.pos.x + 8, w: 20, h: 32 }
    }

    update(elapsedMillis: number, collisions: Collision[]) {

        this.checkFightState();

        if (gameState === GameState.FIGHTING) {



            this.collisionHandler.update(elapsedMillis, this, collisions);
            if (!this.isBlockingActionRunning()) {

                if (this.behaviourTree !== null) {
                    this.behaviourTree.evaluate();
                }
            }

            if (this.standingOnEggState !== null) {
                this.standingOnEggState.update(this, elapsedMillis)
            }

            if (this.itemState !== null) {
                this.itemState.update(this, elapsedMillis);
            }


            if (this.damageState !== null) {
                this.damageState.update(this, elapsedMillis)
            }

        } else if (gameState === GameState.INTRO) {
            if (!(this.movingState instanceof MarioIdleState)) {
                this.movingState = new MarioIdleState();
                this.direction = "right";

            }

        } else if (gameState === GameState.PAUSE) {
            if (!(this.movingState instanceof MarioIdleState)) {
                this.movingState = new MarioIdleState();
                this.direction = "right";
                this.pos.x = MARIO_STARTING_POS.x;
                this.pos.y = MARIO_STARTING_POS.y;
            }
        }

        this._movingState.update(this, elapsedMillis);
        this.movingStateCounter.tick();
    }

    private isBlockingActionRunning() {
        return this._movingState instanceof MarioJumpingState || this._movingState instanceof MarioPickingState || this._movingState instanceof MarioFallingState;
    }

    private checkFightState() {
        if (gameState === GameState.FIGHTING && this.lives === 0) {
            if (this.itemState instanceof MarioHoldingItemState) {
                this.itemState.dropEgg(this);
            }

            this.movingState = new MarioDyingState();
            setGameState(GameState.BIRDO_WON);
        } else if (gameState === GameState.MARIO_WON && !(this.movingState instanceof MarioWinningState) && !(this.movingState instanceof MarioJumpingState)) {
            this.movingState = new MarioWinningState();

        }

    }


    private createBehaviourTree() {

        const root = new OrBranch();

        const holdingEggAnd = new AndBranch();
        const holdingEggCondition = new Leaf(() => this.itemState instanceof MarioHoldingItemState);
        const holdingEggOr = new OrBranch();
        holdingEggAnd.addChildren([holdingEggCondition, holdingEggOr])

        const notHoldingEggAnd = new AndBranch();
        const notHoldingEggCondition = new Leaf(() => !(this.itemState instanceof MarioHoldingItemState))
        const notHoldingEggOr = new OrBranch();
        notHoldingEggAnd.addChildren([notHoldingEggCondition, notHoldingEggOr])


        // NOT HOLDING EGG STUFF
        const isStandingOnEggAnd = new AndBranch();

        const isStandingOnEggCondition = new Leaf(() => {
            return this.standingOnEggState !== null;
        });

        const isStandingOnEggAction = new Leaf(() => {
            const marioBox = this.getCollisionBox();

            if (isOutsideOf(marioBox.x, 2, 320 - marioBox.w)) {

                this.movingState = new MarioJumpingState();
                this.direction = "right";
                this.standingOnEggState = null;


            } else if (this.movingStateCounter.frames > 50) {
                const rand = Math.random();

                if (!(this.itemState instanceof MarioHoldingItemState)) {
                    if (rand < 0.10) {
                        this.movingState = new MarioJumpingState();
                        this.direction = sample(["right", "left"]);
                    } else if (rand < 0.20) {
                        this.movingState = new MarioWalkingState();
                        this.direction = "right"
                        // Mario picks up egg with 80 % chance
                    } else {

                        this.movingState = new MarioPickingState();
                        this.standingOnEggState?.getEgg().pickUp();

                    }
                } else {
                    if (rand < 0.5) {
                        this.movingState = new MarioWalkingState();
                        this.direction = sample(["right", "left"]);
                    } else {
                        this.movingState = new MarioJumpingState();
                        this.direction = sample(["right", "left"]);

                    }
                }
            }

            return true;
        });

        isStandingOnEggAnd.addChildren([isStandingOnEggCondition, isStandingOnEggAction]);

        notHoldingEggOr.addChild(isStandingOnEggAnd);


        const bIsCloseToTheRightAnd = new AndBranch();
        const bIsCloseToTheLeftAnd = new AndBranch();

        const bIsCloseToTheRightCondition = this.createBirdoIsCloseLeaf("right", 25);
        const bIsCloseToTheLeftCondition = this.createBirdoIsCloseLeaf("left", 25);

        const avoidBirdoRightAction = new Leaf(() => {
            this.direction = "left";

            if (!(this.movingState instanceof MarioWalkingState)) {
                this.movingState = new MarioWalkingState();
            }

            return true;
        });

        const avoidBirdoLeftAction = new Leaf(() => {
            this.direction = "right";

            if (!(this.movingState instanceof MarioWalkingState)) {
                this.movingState = new MarioWalkingState();
            }

            return true;
        });

        bIsCloseToTheRightAnd.addChildren([bIsCloseToTheRightCondition, avoidBirdoRightAction]);
        bIsCloseToTheLeftAnd.addChildren([bIsCloseToTheLeftCondition, avoidBirdoLeftAction]);

        const bIsCloseEnoughToTheRightAnd = new AndBranch();
        const bIsCloseEnoughToTheLeftAnd = new AndBranch();

        const bIsCloseEnoughToTheRightCondition = this.createBirdoIsCloseLeaf("right", 60, true);

        const bIsCloseEnoughToTheLeftCondition = this.createBirdoIsCloseLeaf("left", 60, true);

        const throwEggAtBirdoRightAction = new Leaf(() => {
            this.direction = "right";

            if (!(this.itemState instanceof MarioHoldingItemState)) throw "Invalid tree state";

            this.itemState.throwEgg(this);

            this.movingState = new MarioWalkingState();
            this.direction = "left";

            return true;
        });

        const throwEggAtBirdoLeftAction = new Leaf(() => {
            this.direction = "left";

            if (!(this.itemState instanceof MarioHoldingItemState)) throw "Invalid tree state";

            this.itemState.throwEgg(this);

            return true;
        });

        bIsCloseEnoughToTheRightAnd.addChildren([bIsCloseEnoughToTheRightCondition, throwEggAtBirdoRightAction]);
        bIsCloseEnoughToTheLeftAnd.addChildren([bIsCloseEnoughToTheLeftCondition, throwEggAtBirdoLeftAction]);

        const bIsNotCloseAnd = new AndBranch();

        const bIsNotCloseCondition = new Leaf(() => {

            const b = gameObjects.find(o => o instanceof Birdo);

            if (!b) throw "No b internal error";

            const marioBox = this.getCollisionBox();
            const bBox = b.getCollisionBox();

            return !(
                marioBox.x > bBox.x && bBox.x + bBox.w + 100 >= marioBox.x ||
                marioBox.x < bBox.x + bBox.w && marioBox.x + marioBox.w + 100 >= bBox.x);
        });

        const walkTowardsBirdoAction = new Leaf(() => {
            const b = gameObjects.find(o => o instanceof Birdo);

            if (!b) throw "No b internal error";

            const marioBox = this.getCollisionBox();
            const bBox = b.getCollisionBox();

            if (marioBox.x < bBox.x) {
                this.direction = "right"
            } else {
                this.direction = "left"
            }

            if (!(this.movingState instanceof MarioWalkingState)) {
                this.movingState = new MarioWalkingState();
            }

            return true;
        });

        bIsNotCloseAnd.addChildren([bIsNotCloseCondition, walkTowardsBirdoAction])

        const eggIsCloseAnd = new AndBranch();

        const eggIsCloseCondition = new Leaf(() => {
            const egg = gameObjects.find(o => o instanceof Egg);

            if (!egg || egg.state !== EggState.FLYING) return false;

            const marioBox = this.getCollisionBox();
            const eggBox = egg.getCollisionBox();

            const diffPixels = 25;
            // Mario is to the left of the egg and he is getting close
            return marioBox.x < eggBox.x && marioBox.x + marioBox.w + diffPixels >= eggBox.x

        });

        const eggIsCloseAction = new Leaf(() => {
            const rand = Math.random();

            if (rand > 0.5) {
                this.movingState = new MarioJumpingState();
                this.direction = "right";
            }
            // else do nothing 
            return true;
        });

        eggIsCloseAnd.addChildren([eggIsCloseCondition, eggIsCloseAction]);

        /// Platform 

        const platFormIsCloseRightAnd = new AndBranch();

        const isCloseToPlatformRightCondition = new Leaf(() => {
            const platform = gameObjects.find(o => o instanceof Platform);

            if (!platform) throw "No platform internal error";

            const marioBox = this.getCollisionBox();
            const platformBox = platform.getCollisionBox();

            const dist = 10;

            return marioBox.x < platformBox.x && marioBox.x + marioBox.w + dist >= platformBox.x && !(this.itemState instanceof MarioHoldingItemState)
        });


        const jumpOntoPlatformRightAction = new Leaf(() => {

            const rand = Math.random();

            if (!this.isStandingOnPlatform) {
                if (rand > 0.3) {
                    this.movingState = new MarioJumpingState();
                    this.direction = "right";
                }
            }

            // else do nothing 
            return true;

        });


        /// STANDING ON PLATFORM

        const isStandingOnPlatformAnd = new AndBranch();
        const isStandingOnPlatformCondition = new Leaf(() => {
            return this.isStandingOnPlatform;
        });


        const isStandingOnPlatformAction = new Leaf(() => {

            const platform = gameObjects.find(obj => obj instanceof Platform);
            const b = gameObjects.find(obj => obj instanceof Birdo);

            if (!platform) throw "Internal error platform should exist";
            if (!b) throw "Internal error b should exist";

            const marioBox = this.getCollisionBox();
            const platformBox = platform.getCollisionBox();
            const bBox = b.getCollisionBox();

            const bMarioDistX = bBox.x - marioBox.x;

            // close to right edge and b is not close so it is safe to jump or walk down
            if (marioBox.x > platformBox.x + platformBox.w - marioBox.w / 2 && this.direction === "right" && bMarioDistX >= 50) {

                const rand = Math.random();
                if (rand < 0.5) {
                    this.movingState = new MarioJumpingState();
                }

                // Close to the left edge, randomly jump down or walk down
            } else if (marioBox.x < platformBox.x - 8 && this.direction === "left") {

                // if egg is close jump down

                const egg = gameObjects.find(o => o instanceof Egg);

                if (egg && egg.state === EggState.FLYING) {
                    const marioBox = this.getCollisionBox();
                    const eggBox = egg.getCollisionBox();

                    const marioEggDiffX = marioBox.x - (eggBox.x + eggBox.w);


                    if (marioEggDiffX >= 8 && marioEggDiffX < 30) {
                        this.movingState = new MarioJumpingState();

                    }
                } else {
                    if (this.movingStateCounter.frames > 25) {

                        const rand = Math.random();
                        if (rand < 0.5) {
                            this.movingState = new MarioWalkingState();
                            this.direction = sample(["right", "left"]);
                        } else {
                            this.movingState = new MarioIdleState();
                            this.direction = sample(["right", "left"]);
                        }
                    }

                }


            } else if (this.movingStateCounter.frames > 25) {

                const rand = Math.random();
                if (rand < 0.5) {
                    this.movingState = new MarioWalkingState();
                    this.direction = sample(["right", "left"]);
                } else {
                    this.movingState = new MarioIdleState();
                    this.direction = sample(["right", "left"]);
                }
            }

            return true;
        });

        isStandingOnEggAnd.addChildren([isStandingOnEggCondition, isStandingOnEggAction]);

        isStandingOnPlatformAnd.addChildren([isStandingOnPlatformCondition, isStandingOnPlatformAction]);

        platFormIsCloseRightAnd.addChildren([isCloseToPlatformRightCondition, jumpOntoPlatformRightAction]);

        notHoldingEggOr.addChild(isStandingOnPlatformAnd);
        notHoldingEggOr.addChild(eggIsCloseAnd);
        notHoldingEggOr.addChild(platFormIsCloseRightAnd);
        notHoldingEggOr.addChild(bIsCloseToTheRightAnd);
        notHoldingEggOr.addChild(bIsCloseToTheLeftAnd);

        const eggIsNotCloseAnd = new AndBranch();

        const eggIsNotCloseCondition = new Leaf(() => {
            const egg = gameObjects.find(o => o instanceof Egg);

            if (!egg) return true;

            const marioBox = this.getCollisionBox();
            const eggBox = egg.getCollisionBox();

            const diffPixels = 25;
            // Negate condition for when egg is close
            return !(marioBox.x < eggBox.x && marioBox.x + marioBox.w + diffPixels >= eggBox.x)

        });

        const eggIsNotCloseAction = new Leaf(() => {

            if (this.movingStateCounter.frames > 50) {
                if (this.movingState instanceof MarioIdleState) {
                    this.direction = "right";
                    this.movingState = new MarioWalkingState();
                } else {
                    this.direction = "right";
                    this.movingState = new MarioIdleState();
                }
            }

            return true;

        });

        eggIsNotCloseAnd.addChildren([eggIsNotCloseCondition, eggIsNotCloseAction]);

        notHoldingEggOr.addChild(eggIsNotCloseAnd);

        // HOLDING EGG STUFF 

        holdingEggOr.addChild(isStandingOnEggAnd);
        holdingEggOr.addChild(eggIsCloseAnd);
        holdingEggOr.addChild(isStandingOnPlatformAnd);
        holdingEggOr.addChild(platFormIsCloseRightAnd);
        holdingEggOr.addChildren([bIsCloseToTheLeftAnd, bIsCloseToTheRightAnd]);
        holdingEggOr.addChild(bIsCloseEnoughToTheLeftAnd);
        holdingEggOr.addChild(bIsCloseEnoughToTheRightAnd);
        holdingEggOr.addChild(bIsNotCloseAnd);

        root.addChildren([notHoldingEggAnd, holdingEggAnd]);

        return root;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.asset === null) throw "Asset is null, should not happen";

        for (let l = 0; l < this.lives; ++l) {
            ctx.drawImage(AssetManager.getInstance().get("heart"), 304 - l * 16, 0);
        }

        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

    private createBirdoIsCloseLeaf(side: "right" | "left", closeDist: number, addRandomizedDiffDist?: boolean) {

        return new Leaf(() => {
            const b = gameObjects.find(o => o instanceof Birdo);

            if (!b) throw "No b internal error";

            const marioBox = this.getCollisionBox();
            const bBox = b.getCollisionBox();

            const doubleCloseDiff = addRandomizedDiffDist ? Math.random() > 0.5 : false;
            const dist = doubleCloseDiff ? closeDist + closeDist : closeDist;

            return side === "left" ?
                marioBox.x > bBox.x && bBox.x + bBox.w + dist >= marioBox.x :
                marioBox.x < bBox.x + bBox.w && marioBox.x + marioBox.w + dist >= bBox.x;
        });
    }
}

