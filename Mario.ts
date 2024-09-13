import AssetHandler from "./AssetHandler";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState } from "./types";
import { Egg } from "./Egg";

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

        if (mario.itemState instanceof MarioHoldingItemState) {
            return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0")
        }

        return mario.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
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

        mario.asset = this.getAsset(mario);
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetHandler.getInstance();

        return this.frame % 4 === 0 ? assetHandler.get("walk-right-0-damage") : assetHandler.get("walk-right-0");
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

        if (mario.itemState instanceof MarioHoldingItemState) {
            switch (this.walkFrame) {
                case 0:
                    return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0");
                case 1:
                    return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-1") : assetHandler.get("walk-left-holding-item-1");
                case 2:
                    return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0");
                case 3:
                    return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-2") : assetHandler.get("walk-left-holding-item-2");
                default:
                    return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0");
            }
        } else {
            switch (this.walkFrame) {
                case 0:
                    return mario.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
                case 1:
                    return mario.direction === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
                case 2:
                    return mario.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
                case 3:
                    return mario.direction === "right" ? assetHandler.get("walk-right-2") : assetHandler.get("walk-left-2");
                default:
                    return mario.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
            }
        }

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

        if (mario.itemState instanceof MarioHoldingItemState) {
            return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-1") : assetHandler.get("walk-left-holding-item-1")
        } else {
            return mario.direction === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
        }
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

        if (mario.itemState instanceof MarioHoldingItemState) {
            return mario.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0")
        }

        return mario.direction === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
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
        mario.asset = this.getAsset();

        // Change to Holding item state after 500 ms
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        if (this.elapsedMillisDiff >= 500) {
            mario.itemState = new MarioHoldingItemState(elapsedMillis, mario.collisionHandler.pickUpEgg(mario)!); // Should not enter this state if egg is null


        }
    }

    private getAsset() {
        const assetHandler = AssetHandler.getInstance();
        return assetHandler.get("lift-0");
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

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
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
        if (this.elapsedMillisDiff >= 500) {


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
    update(mario: Mario, collisions: Collision[], elapsedMillis: number) {

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

            // Eggcollision but not standing on it
            else if (eggCollision !== undefined && mario.damageState === null) {

                mario.damageState = new MarioDamageState(elapsedMillis);


                // Is no longer on the egg.
            } else if (eggCollision === undefined && this.egg !== null) {
                this.egg = null;

                if (mario.movingState instanceof MarioWalkingState) {
                    // Fall down
                    mario.pos.y = MARIO_STARTING_POS.y;
                    mario.movingState = new MarioFallingState();
                } else if (mario.movingState instanceof MarioJumpingState) {

                }

            }
        }

        if (this.egg !== null && !foundSouthCollisionWithEgg) {
            this.egg = null;

            if (mario.movingState instanceof MarioWalkingState) {
                mario.movingState = new MarioFallingState();
            } else if (mario.movingState instanceof MarioJumpingState) {

            }
        }
    }
}

export class Mario implements GameObject {

    kind: GameObjectKind = GameObjectKind.MARIO;
    direction: "right" | "left";
    pos: Point;
    vel: Point;
    asset: HTMLImageElement | null;
    private lives: number;

    movingState: MarioState;
    itemState: MarioState | null;
    damageState: MarioState | null;
    collisionHandler: MarioCollisionsHandler;

    constructor() {
        this.lives = 5;
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

        assetHandler.register("walk-right-0", "./assets/mario-walk-right-0.png");
        assetHandler.register("walk-right-0-damage", "./assets/mario-walk-right-0-damage.png");
        assetHandler.register("walk-right-1", "./assets/mario-walk-right-1.png");
        assetHandler.register("walk-right-2", "./assets/mario-walk-right-2.png");
        assetHandler.register("walk-left-0", "./assets/mario-walk-left-0.png");
        assetHandler.register("walk-left-1", "./assets/mario-walk-left-1.png");
        assetHandler.register("walk-left-2", "./assets/mario-walk-left-2.png");
        assetHandler.register("lift-0", "./assets/mario-lift-0.png");

        assetHandler.register("walk-right-holding-item-0", "./assets/mario-walk-right-holding-item-0.png");
        assetHandler.register("walk-right-holding-item-1", "./assets/mario-walk-right-holding-item-1.png");
        assetHandler.register("walk-right-holding-item-2", "./assets/mario-walk-right-holding-item-2.png");
        assetHandler.register("walk-left-holding-item-0", "./assets/mario-walk-left-holding-item-0.png");
        assetHandler.register("walk-left-holding-item-1", "./assets/mario-walk-left-holding-item-1.png");
        assetHandler.register("walk-left-holding-item-2", "./assets/mario-walk-left-holding-item-2.png");

        assetHandler.register("throw-left", "./assets/mario-throw-left.png");
        assetHandler.register("throw-right", "./assets/mario-throw-right.png");

    }

    getCollisionBox(): CollisionBox {
        return { y1: this.pos.y + 8, x1: this.pos.x, x2: this.pos.x + 32, y2: this.pos.y + 48 }
    }

    update(elapsedMillis: number, keys: KeyState, collisions: Collision[]) {

        this.collisionHandler.update(this, collisions, elapsedMillis);

        this.movingState.handleInput(this, elapsedMillis, keys);

        this.movingState.update(this, elapsedMillis);

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

