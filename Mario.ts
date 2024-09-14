import AssetHandler from "./AssetHandler";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState, ConnectedObjects } from "./types";
import { Egg } from "./Egg";

const MARIO_STARTING_POS: Point = { y: 135 - 48, x: -6 };

interface MarioState {
    handleInput: (mario: Mario, elapsedMillis: number, keys: KeyState, connections: ConnectedObjects) => void;
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

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["a"] && !keys["d"]) {
            mario.direction = "left";
            mario.movingState = new MarioWalkingState(elapsedMillis);
        } else if (!keys["a"] && keys["d"]) {
            mario.direction = "right";
            mario.movingState = new MarioWalkingState(elapsedMillis);
        } else if (keys[" "]) {
            mario.movingState = new MarioJumpingState();
        } else if (keys["s"] && mario.collisionHandler.isStandingOnEgg() && !(mario.itemState instanceof MarioHoldingItemState)) {
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

        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${mario.damageState instanceof MarioDamageState ? "-damage" : ""}1`);
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
    private frame: number;


    constructor(elapsedMillis: number,) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillisDiff = 0;
        this.frame = 0;

    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        // Nothing can happen based on input
    }

    update(mario: Mario, elapsedMillis: number) {
        // Update millis diff
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;
        this.frame++;

        // Will keep mario in a throwing state until 500 ms has elapsed
        if (this.elapsedMillisDiff >= 1000) {
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

    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.walkFrame = 0;
        this.elapsedMillisDiff = 0;
    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (mario.direction === "left" && !keys["a"]) {
            mario.movingState = new MarioIdleState();
        } else if (mario.direction === "right" && !keys["d"]) {
            mario.movingState = new MarioIdleState();
        } else if (keys[" "]) {
            mario.movingState = new MarioJumpingState();
        } else if (keys["s"] && mario.collisionHandler.isStandingOnEgg() && !(mario.itemState instanceof MarioHoldingItemState)) {
            mario.movingState = new MarioPickingState(elapsedMillis);
        }
    }

    update(mario: Mario, elapsedMillis: number) {
        if (mario.direction === "left") {
            mario.vel.x = -1;
        } else {
            mario.vel.x = 1;
        }

        mario.pos.x += mario.vel.x;
        mario.pos.y += mario.vel.y;

        this.updateFrame(elapsedMillis);
        mario.asset = this.getAsset(mario);
    }

    private getAsset(mario: Mario) {

        const assetHandler = AssetHandler.getInstance();

        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${mario.damageState instanceof MarioDamageState ? "-damage" : ""}${this.walkFrame + 1}`);
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

    constructor() {
        this.frame = 0;
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

        return assetHandler.get(`walk-${mario.direction}${mario.itemState instanceof MarioHoldingItemState ? "-holding-item" : ""}${mario.damageState instanceof MarioDamageState ? "-damage" : ""}2`);

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

        if (this.elapsedMillisDiff >= 300) {
            mario.itemState = new MarioHoldingItemState(elapsedMillis, mario.collisionHandler.pickUpEgg(mario)!); // Should not enter this state if egg is null


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
        egg.pickUp();
        this.yDiff = 1;
        this.elapsedMillisDiff = 0;
        this.prevMillis = elapsedMillis;

    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState, connections: ConnectedObjects) {
        if (keys["ö"]) {
            // Throw 
            mario.itemState = new MarioThrowingItemState(elapsedMillis);



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
}

class MarioThrowingItemState implements MarioState {
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

        mario.asset = this.getAsset(mario);

        // Update millis diff
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        // Will keep mario in a throwing state until 500 ms has elapsed
        if (this.elapsedMillisDiff >= 250) {
            mario.itemState = null;
        }
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetHandler.getInstance();
        return mario.direction === "left" ? assetHandler.get("throw-left") : assetHandler.get("throw-right");
    }
}


/**
 * This class checks for collisions with an egg that the dragon throws and if so updateds marios x and y according to the egg's x and y. 
 */
class MarioCollisionsHandler {

    private egg: Egg | null;

    constructor() {
        this.egg = null;
    }

    isStandingOnEgg() {
        return this.egg !== null;
    }

    getEgg() {
        return this.egg;
    }

    pickUpEgg(mario: Mario) {
        const egg = this.egg;


        mario.movingState = new MarioFallingState();
        this.egg = null;
        return egg;
    }


    /**
     * Checks for collision with egg. If collision just begun we sett the egg to the instance of that egg. 
     */
    update(elapsedMillis: number, mario: Mario, collisions: Collision[], connections: ConnectedObjects) {

        let foundSouthCollisionWithEgg = false;

        for (const collision of collisions) {

            const eggCollision = collision.obj.kind === GameObjectKind.EGG ? collision : undefined;

            // Standing on egg begins
            if (eggCollision !== undefined && eggCollision.collisionPoint === "south" && this.egg === null) {



                foundSouthCollisionWithEgg = true;

                if (mario.movingState instanceof MarioJumpingState) {
                    mario.movingState = new MarioIdleState();
                }

                mario.pos.y = eggCollision.obj.pos.y - 48;

                this.egg = eggCollision.obj as Egg;

                // Is standing on egg already 
            } else if (eggCollision !== undefined && eggCollision.collisionPoint === "south" && this.egg !== null) {

                foundSouthCollisionWithEgg = true;

                // Update marios position according to egg
                mario.pos.y += this.egg.vel.y;
                mario.pos.x += this.egg.vel.x;
            }

            // Eggcollision but not standing on it and not holding the egg e.g. not connected to it
            else if (eggCollision !== undefined && mario.damageState === null && !(mario.itemState instanceof MarioHoldingItemState) && !(mario.itemState instanceof MarioThrowingItemState)) {

                mario.damageState = new MarioDamageState(elapsedMillis);
                mario.kills += 1;
                console.log("MARIO KILLS", mario.kills)

            }
        }

        if (this.egg !== null && !foundSouthCollisionWithEgg) {

            // Remove as connected to mario.

            this.egg = null;


            if (mario.movingState instanceof MarioWalkingState) {
                mario.movingState = new MarioFallingState();
            } else if (mario.movingState instanceof MarioJumpingState) {

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
    collisionHandler: MarioCollisionsHandler;

    constructor() {
        this.id = "mario";
        this.kills = 0;
        this.pos = { ...MARIO_STARTING_POS };
        this.vel = { x: 0, y: 0 };
        this.asset = null;
        this.direction = "right";
        this.movingState = new MarioIdleState();
        this.itemState = null;
        this.damageState = null;
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
        return { y1: this.pos.y + 8, x1: this.pos.x, x2: this.pos.x + 32, y2: this.pos.y + 48 }
    }

    update(elapsedMillis: number, keys: KeyState, collisions: Collision[], connections: ConnectedObjects) {

        this.collisionHandler.update(elapsedMillis, this, collisions, connections);

        this.movingState.handleInput(this, elapsedMillis, keys, connections);

        this.movingState.update(this, elapsedMillis);

        if (this.itemState !== null) {
            this.itemState.handleInput(this, elapsedMillis, keys, connections);
            this.itemState.update(this, elapsedMillis);
        }

        if (this.damageState !== null) {
            this.damageState.handleInput(this, elapsedMillis, keys, connections);
            this.damageState.update(this, elapsedMillis)
        }
    }

    draw(ctx: CanvasRenderingContext2D) {

        if (this.asset === null) throw "Asset is null";
        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

}

