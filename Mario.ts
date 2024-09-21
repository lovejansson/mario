import AssetHandler from "./AssetHandler";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState } from "./types";
import { Egg } from "./Egg";
import { Dragon } from "./Dragon";



const MARIO_STARTING_POS: Point = { y: 135 - 48, x: -6 };

interface MarioState {
    handleInput: (mario: Mario, elapsedMillis: number, keys: KeyState) => void;
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

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["a"] && !keys["d"]) {
            mario.direction = "left";
            mario.movingState = new MarioWalkingState(elapsedMillis);
        } else if (!keys["a"] && keys["d"]) {
            mario.direction = "right";
            mario.movingState = new MarioWalkingState(elapsedMillis);
        } else if (keys[" "]) {


            if (mario.standingOnEggState) {

                mario.standingOnEggState = null;
            };
            mario.movingState = new MarioJumpingState();
        } else if (keys["s"] && mario.standingOnEggState !== null && !(mario.itemState instanceof MarioHoldingItemState)) {

            mario.movingState = new MarioPickingState(elapsedMillis);
        }
    }

    update(mario: Mario, _: number) {
        mario.asset = this.getAsset(mario);
        mario.vel.x = 0;
        mario.vel.y = 0;
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetHandler.getInstance();

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

    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        // Nothing can happen based on input
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

    private prevMillis: number;
    private elapsedMillisDiff: number;
    private walkFrame: 0 | 1 | 2 | 3;
    private flipFlop: boolean;


    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.walkFrame = 0;
        this.elapsedMillisDiff = 0;
        this.flipFlop = true;
    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (mario.direction === "left" && !keys["a"]) {
            mario.movingState = new MarioIdleState();
        } else if (mario.direction === "right" && !keys["d"]) {
            mario.movingState = new MarioIdleState();
        } else if (keys[" "]) {
            mario.movingState = new MarioJumpingState();
        } else if (keys["s"] && mario.standingOnEggState !== null && !(mario.itemState instanceof MarioHoldingItemState)) {
            mario.movingState = new MarioPickingState(elapsedMillis);
        }
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

    private getAsset(mario: Mario) {

        const assetHandler = AssetHandler.getInstance();

        if (mario.damageState instanceof MarioDamageState) {
            this.flipFlop = !this.flipFlop;
            return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${this.flipFlop ? "-damage" : ""}${this.walkFrame + 1}`);
        }

        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${this.walkFrame + 1}`);
    }


    private updateFrame(elapsedMillis: number) {
        // Change sprite frame every 150 ms
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

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

    private frame: number;
    private flipFlop: boolean;


    constructor() {
        this.frame = 0;
        this.flipFlop = true;
    }

    handleInput(mario: Mario, _: number, keys: KeyState) {
        // Adjusts velocity x according to if user steers mario with a or d
        if (keys["a"] && !keys["d"]) {
            mario.vel.x = -1;
        } else if (keys["d"] && !keys["a"]) {
            mario.vel.x = 1;
        }
    }

    update(mario: Mario, _: number) {

        // If in the air and landed on egg it should change state to idle state
        // But if standing on egg and starts jumping should not?
        if (mario.standingOnEggState !== null) {
            mario.pos.y = mario.standingOnEggState.getEgg().pos.y - 47; // Initialize mario y to egg
            mario.movingState = new MarioIdleState();
            return;
        }

        mario.asset = this.getAsset(mario);


        // Determine velocity y

        const g = 1;
        const vi = -12;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
        mario.vel.y = vi + (g * this.frame);

        const marioPosY = mario.pos.y + mario.vel.y;

        if (marioPosY > MARIO_STARTING_POS.y) {
            // Jump is done
            mario.movingState = new MarioIdleState();
            mario.pos.y = MARIO_STARTING_POS.y;
            mario.vel.y = 0;

        } else {
            mario.pos.y = marioPosY;
            this.frame++;
        }

        mario.pos.x += mario.vel.x;

    }

    private getAsset(mario: Mario) {

        const assetHandler = AssetHandler.getInstance();

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

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        // Adjusts velocity x according to if user steers mario with a or d
        if (keys["a"] && !keys["d"]) {
            mario.vel.x = -1;
        } else if (keys["d"] && !keys["a"]) {
            mario.vel.x = 1;
        }
    }

    update(mario: Mario, elapsedMillis: number) {

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

            mario.movingState = new MarioWalkingState(elapsedMillis);
        } else {
            mario.pos.y = marioPosY;
            mario.pos.x += mario.vel.x;
            this.frame++;
        }

    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetHandler.getInstance();
        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${mario.damageState instanceof MarioDamageState ? "-damage" : ""}2`);

    }
}

class MarioPickingState implements MarioState {

    private prevMillis: number;
    private elapsedMillisDiff: number;


    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillisDiff = 0;

    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        // Nothing can happen based on input
    }

    update(mario: Mario, elapsedMillis: number) {

        mario.asset = this.getAsset(mario);


        // Change to Holding item state after 500 ms
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        if (this.elapsedMillisDiff >= 300 && mario.standingOnEggState) {

            const egg = mario.standingOnEggState.getEgg();

            mario.standingOnEggState = null;
            mario.movingState = new MarioFallingState();
            mario.itemState = new MarioHoldingItemState(elapsedMillis, egg); // Should not enter this state if egg is null

        }
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetHandler.getInstance();
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

        egg.pickUp(); // will prevent egg from updating its position, it now belongs to mario. 
        this.yDiff = 1;
        this.elapsedMillisDiff = 0;
        this.prevMillis = elapsedMillis;

    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["ö"]) {
            // Throw 
            mario.itemState = new MarioThrowingItemState(elapsedMillis, this.egg);
            this.egg.throw(mario.direction);
        }
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

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {

    }

    update(mario: Mario, elapsedMillis: number) {

        // Update according to moving egg
        mario.pos.y += this.egg.vel.y;
        mario.pos.x += this.egg.vel.x;


    }
}

class MarioThrowingItemState implements MarioState {
    private prevMillis: number;
    private elapsedMillisDiff: number;
    private egg: Egg;

    constructor(elapsedMillis: number, egg: Egg) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillisDiff = 0;
        this.egg = egg;
    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        // Nothing can happen based on input
    }

    update(mario: Mario, elapsedMillis: number) {

        mario.asset = this.getAsset(mario);

        // Update millis diff
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        // Will keep mario in a throwing state until 500 ms has elapsed
        if (this.elapsedMillisDiff >= 250) {
            mario.itemState = null;
        }
    }

    getEgg() {
        return this.egg;
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetHandler.getInstance();
        return mario.direction === "left" ? assetHandler.get("throw-left") : assetHandler.get("throw-right");
    }
}


/**
 * This class checks for collisions and updates marios state. 
 */
class MarioCollisionsHandler {


    /**
     * Checks for collision with egg and dragon. 
     */
    update(elapsedMillis: number, mario: Mario, collisions: Collision[]) {

        let isStandingOnEgg = false;

        for (const collision of collisions) {

            // Standing on egg
            if (collision.obj instanceof Egg && collision.collisionPoint === "south") {

                if (mario.standingOnEggState === null) {
                    mario.standingOnEggState = new MarioStandingOnEggState(collision.obj);
                }

                isStandingOnEgg = true;
            }

            // If not throwing or holding the egg that mario is colliding with, he will take damage
            else if (!(collision.obj instanceof Egg && (mario.itemState instanceof MarioHoldingItemState && (mario.itemState as MarioHoldingItemState).getEgg() === collision.obj) || (mario.itemState instanceof MarioThrowingItemState &&
                (mario.itemState as MarioThrowingItemState).getEgg() == collision.obj
            ))) {


                mario.damageState = new MarioDamageState(elapsedMillis);
                mario.kills += 1;



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

export class Mario implements GameObject {

    id: string;
    kind: GameObjectKind = GameObjectKind.MARIO;
    direction: "right" | "left";
    pos: Point;
    vel: Point;
    asset: HTMLImageElement | null;
    kills: number;

    movingState: MarioState;
    itemState: MarioState | null;
    damageState: MarioState | null;
    standingOnEggState: MarioStandingOnEggState | null;
    collisionHandler: MarioCollisionsHandler;

    constructor() {
        this.id = "mario";
        this.kills = 0;
        this.pos = { ...MARIO_STARTING_POS };
        this.vel = { x: 0, y: 0 };
        this.asset = null;
        this.direction = "right";
        this.movingState = new MarioIdleState(); // MarioWalkingState, MarioIdleState, MarioPickingItemState, MarioJumpState, MarioFallingState ---> Can only do one thing at a time
        this.itemState = null; // ---> MarioHoldingItemState, MarioThrowingItemState ---> can do either of these at a time. Mario can at the same time walk, stand still, jump or fall. 
        this.damageState = null; // --> Can be taking damage or not, will animate a flickering whiteish image 
        this.standingOnEggState = null; // --> Can be standing on egg or not, will update marios x and y pos according to the eggs vel
        this.collisionHandler = new MarioCollisionsHandler();
    }

    init() {
        const assetHandler = AssetHandler.getInstance();

        assetHandler.register("walk-right1", "./assets/mario-walk-right1.png");
        assetHandler.register("walk-right2", "./assets/mario-walk-right2.png");
        assetHandler.register("walk-right3", "./assets/mario-walk-right3.png");
        assetHandler.register("walk-right4", "./assets/mario-walk-right4.png");
        assetHandler.register("walk-right-damage1", "./assets/mario-walk-right-damage1.png");
        assetHandler.register("walk-right-damage2", "./assets/mario-walk-right-damage2.png");
        assetHandler.register("walk-right-damage3", "./assets/mario-walk-right-damage3.png");
        assetHandler.register("walk-right-damage4", "./assets/mario-walk-right-damage4.png");

        assetHandler.register("walk-left1", "./assets/mario-walk-left1.png");
        assetHandler.register("walk-left2", "./assets/mario-walk-left2.png");
        assetHandler.register("walk-left3", "./assets/mario-walk-left3.png");
        assetHandler.register("walk-left4", "./assets/mario-walk-left4.png");

        assetHandler.register("walk-left-damage1", "./assets/mario-walk-left-damage1.png");
        assetHandler.register("walk-left-damage2", "./assets/mario-walk-left-damage2.png");
        assetHandler.register("walk-left-damage3", "./assets/mario-walk-left-damage3.png");
        assetHandler.register("walk-left-damage4", "./assets/mario-walk-left-damage4.png");

        assetHandler.register("lift", "./assets/mario-lift.png");

        assetHandler.register("lift-damage", "./assets/mario-lift-damage.png");

        assetHandler.register("walk-right-holding-item1", "./assets/mario-walk-right-holding-item1.png");
        assetHandler.register("walk-right-holding-item2", "./assets/mario-walk-right-holding-item2.png");
        assetHandler.register("walk-right-holding-item3", "./assets/mario-walk-right-holding-item3.png");
        assetHandler.register("walk-right-holding-item4", "./assets/mario-walk-right-holding-item4.png");


        assetHandler.register("walk-right-holding-item-damage1", "./assets/mario-walk-right-holding-item-damage1.png");
        assetHandler.register("walk-right-holding-item-damage2", "./assets/mario-walk-right-holding-item-damage2.png");
        assetHandler.register("walk-right-holding-item-damage3", "./assets/mario-walk-right-holding-item-damage3.png");
        assetHandler.register("walk-right-holding-item-damage4", "./assets/mario-walk-right-holding-item-damage4.png");

        assetHandler.register("walk-left-holding-item1", "./assets/mario-walk-left-holding-item1.png");
        assetHandler.register("walk-left-holding-item2", "./assets/mario-walk-left-holding-item2.png");
        assetHandler.register("walk-left-holding-item3", "./assets/mario-walk-left-holding-item3.png");
        assetHandler.register("walk-left-holding-item4", "./assets/mario-walk-left-holding-item4.png");


        assetHandler.register("walk-left-holding-item-damage1", "./assets/mario-walk-left-holding-item-damage1.png");
        assetHandler.register("walk-left-holding-item-damage2", "./assets/mario-walk-left-holding-item-damage2.png");
        assetHandler.register("walk-left-holding-item-damage3", "./assets/mario-walk-left-holding-item-damage3.png");
        assetHandler.register("walk-left-holding-item-damage4", "./assets/mario-walk-left-holding-item-damage4.png");


        assetHandler.register("throw-left", "./assets/mario-throw-left.png");
        assetHandler.register("throw-right", "./assets/mario-throw-right.png");

    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y + 16, x: this.pos.x + 8, w: 20, h: 32 }
    }

    update(elapsedMillis: number, keys: KeyState, collisions: Collision[]) {


        this.collisionHandler.update(elapsedMillis, this, collisions);

        this.movingState.handleInput(this, elapsedMillis, keys);

        this.movingState.update(this, elapsedMillis);


        if (this.standingOnEggState !== null) {
            this.standingOnEggState.handleInput(this, elapsedMillis, keys);
            this.standingOnEggState.update(this, elapsedMillis)
        }

        if (this.itemState !== null) {
            this.itemState.handleInput(this, elapsedMillis, keys);
            this.itemState.update(this, elapsedMillis);
        }


        if (this.damageState !== null) {
            this.damageState.handleInput(this, elapsedMillis, keys);
            this.damageState.update(this, elapsedMillis)
        }


    }

    draw(ctx: CanvasRenderingContext2D) {

        if (this.asset === null) throw "Asset is null";
        ctx.drawImage(this.asset, this.pos.x, this.pos.y);

    }

}

