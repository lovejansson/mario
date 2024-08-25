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
    private direction: "right" | "left";

    constructor(direction: "right" | "left") {
        this.direction = direction;
    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["a"] && !keys["d"]) {
            mario.movingState = new MarioWalkingState("left", elapsedMillis);
        } else if (!keys["a"] && keys["d"]) {
            mario.movingState = new MarioWalkingState("right", elapsedMillis);
        } else if (keys[" "]) {
            mario.movingState = new MarioJumpingState(this.direction, elapsedMillis, { ...mario.pos });
        } else if (keys["s"] && mario.collisionHandler.isStandingOnEgg() && !(mario.itemState instanceof MarioHoldingItemState)) {
            mario.movingState = new MarioPickingState(elapsedMillis, this.direction);
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
            return this.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0")
        }

        return this.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
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
    direction: "right" | "left";
    private prevMillis: number;
    private elapsedMillisDiff: number;
    private walkFrame: 0 | 1 | 2 | 3;

    constructor(direction: "right" | "left", elapsedMillis: number) {
        this.direction = direction;
        this.prevMillis = elapsedMillis;
        this.walkFrame = 0;
        this.elapsedMillisDiff = 0;
    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (this.direction === "left" && !keys["a"]) {
            mario.movingState = new MarioIdleState("left");
        } else if (this.direction === "right" && !keys["d"]) {
            mario.movingState = new MarioIdleState("right");
        } else if (keys[" "]) {
            mario.movingState = new MarioJumpingState(this.direction, elapsedMillis, { ...mario.pos });
        } else if (keys["s"] && mario.collisionHandler.isStandingOnEgg() && !(mario.itemState instanceof MarioHoldingItemState)) {
            mario.movingState = new MarioPickingState(elapsedMillis, this.direction);
        }
    }

    update(mario: Mario, elapsedMillis: number) {
        if (this.direction === "left") {
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
                    return this.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0");
                case 1:
                    return this.direction === "right" ? assetHandler.get("walk-right-holding-item-1") : assetHandler.get("walk-left-holding-item-1");
                case 2:
                    return this.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0");
                case 3:
                    return this.direction === "right" ? assetHandler.get("walk-right-holding-item-2") : assetHandler.get("walk-left-holding-item-2");
                default:
                    return this.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0");
            }
        } else {
            switch (this.walkFrame) {
                case 0:
                    return this.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
                case 1:
                    return this.direction === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
                case 2:
                    return this.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
                case 3:
                    return this.direction === "right" ? assetHandler.get("walk-right-2") : assetHandler.get("walk-left-2");
                default:
                    return this.direction === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
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

    private startMillis: number;
    direction: "right" | "left";
    private startPos: Point;


    constructor(direction: "right" | "left", elapsedMillis: number, startPos: Point) {
        this.startMillis = elapsedMillis;
        this.direction = direction;
        this.startPos = startPos;

    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["a"] && !keys["d"]) {
            mario.vel.x = -1;
        } else if (keys["d"] && !keys["a"]) {
            mario.vel.x = 1;
        }
    }

    update(mario: Mario, elapsedMillis: number) {
        mario.asset = this.getAsset(mario);

        mario.pos.x += mario.vel.x;

        const marioPosY = this.getJumpPos(elapsedMillis - this.startMillis);

        if (marioPosY > MARIO_STARTING_POS.y) {
            // Jump is done
            mario.movingState = new MarioIdleState(this.direction);
            mario.pos.y = MARIO_STARTING_POS.y;
        } else {
            mario.pos.y = marioPosY;
        }

    }

    private getAsset(mario: Mario) {

        const assetHandler = AssetHandler.getInstance();

        if (mario.itemState instanceof MarioHoldingItemState) {
            return this.direction === "right" ? assetHandler.get("walk-right-holding-item-1") : assetHandler.get("walk-left-holding-item-1")
        } else {
            return this.direction === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
        }
    }

    private getJumpPos(jumpMillis: number) {
        /* 
            f(t) = at² + bt + c
            f(t) is the vertical position, relative to the ground
            t is the time since the start of the jump
            a relates to gravity (it's negative, because it points downwards)
            b relates to velocity, or more specifically, the initial jump velocity (it's positive, because it points upwards)
        */
        const t = jumpMillis / 100;
        return Math.round(this.startPos.y - (50 * t - 10 * Math.pow(t, 2)));
    }

}

/**
 * Mario's falling state. 
 * 
 * Transitions: 
 * - After falling is done -> MarioIdleState
 */
class MarioFallingState implements MarioState {
    direction: "right" | "left";

    constructor(direction: "right" | "left") {
        this.direction = direction;
    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["a"] && !keys["d"]) {
            mario.vel.x = -1;
        } else if (keys["d"] && !keys["a"]) {
            mario.vel.x = 1;
        }
    }

    update(mario: Mario, _: number) {
        // TODO FALLING UPDATE OF y pos 
    }

    private getAsset(mario: Mario) {
        const assetHandler = AssetHandler.getInstance();

        if (mario.itemState instanceof MarioHoldingItemState) {
            return this.direction === "right" ? assetHandler.get("walk-right-holding-item-0") : assetHandler.get("walk-left-holding-item-0")
        }

        return this.direction === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
    }
}

class MarioPickingState implements MarioState {

    private prevMillis: number;
    private elapsedMillisDiff: number;
    private direction: "right" | "left";

    constructor(elapsedMillis: number, direction: "right" | "left") {
        this.prevMillis = elapsedMillis;
        this.elapsedMillisDiff = 0;
        this.direction = direction;

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

            mario.movingState = new MarioIdleState(this.direction);
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
        }
    }

    update(mario: Mario, elapsedMillis: number) {
        // Do nothing
        this.egg.pos.x = mario.pos.x + 8;
        this.egg.pos.y = mario.pos.y + this.yDiff;

        if (mario.movingState instanceof MarioWalkingState) {
            // Change to Holding item state after 500 ms
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
    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["s"] || keys["a"]) {
            // Set to walking state
        }
    }

    update(mario: Mario, elapsedMillis: number) {
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

    pickUpEgg(mario: Mario) {
        const egg = this.egg;
        // Fall down
        mario.pos.y = MARIO_STARTING_POS.y;
        this.egg = null;
        return egg;
    }

    update(mario: Mario, collisions: Collision[]) {

        let foundSouthCollisionWithEgg = false;

        for (const collision of collisions) {

            const eggCollision = collision.obj.kind === GameObjectKind.EGG ? collision : undefined;

            // Standing on egg begins
            if (eggCollision !== undefined && eggCollision.collisionPoint === "south" && this.egg === null) {
                foundSouthCollisionWithEgg = true;

                if (mario.movingState instanceof MarioJumpingState) {
                    mario.movingState = new MarioIdleState(mario.movingState.direction);
                }

                mario.pos.y = eggCollision.obj.pos.y - 48;
                this.egg = eggCollision.obj as Egg;

                // Is standing on egg
            } else if (eggCollision !== undefined && eggCollision.collisionPoint === "south" && this.egg !== null) {

                foundSouthCollisionWithEgg = true;

                mario.pos.y += this.egg.vel.y;
                mario.pos.x += this.egg.vel.x;

                // Is no longer on the egg.
            } else if (eggCollision === undefined && this.egg !== null) {
                this.egg = null;

                if (mario.movingState instanceof MarioWalkingState) {
                    // Fall down
                    mario.pos.y = MARIO_STARTING_POS.y;
                } else if (mario.movingState instanceof MarioJumpingState) {

                }
                // Set mario in a falling state. 
            }
        }

        if (this.egg !== null && !foundSouthCollisionWithEgg) {
            this.egg = null;

            if (mario.movingState instanceof MarioWalkingState) {
                // Fall down
                mario.pos.y = MARIO_STARTING_POS.y;
            } else if (mario.movingState instanceof MarioJumpingState) {

            }
        }
    }
}

export class Mario implements GameObject {

    kind: GameObjectKind = GameObjectKind.MARIO;

    pos: Point;
    vel: Point;
    asset: HTMLImageElement | null;
    private lives: number;

    movingState: MarioState;
    itemState: MarioState | null;
    collisionHandler: MarioCollisionsHandler;

    constructor() {

        this.lives = 5;
        this.pos = { ...MARIO_STARTING_POS };
        this.vel = { x: 0, y: 0 };
        this.asset = null;

        this.movingState = new MarioIdleState("right");
        this.itemState = null;
        this.collisionHandler = new MarioCollisionsHandler();

    }

    init() {
        const assetHandler = AssetHandler.getInstance();

        assetHandler.register("walk-right-0", "./assets/mario-walk-right-0.png");
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

        this.collisionHandler.update(this, collisions);

        this.movingState.handleInput(this, elapsedMillis, keys);

        this.movingState.update(this, elapsedMillis);

        this.itemState?.handleInput(this, elapsedMillis, keys);
        this.itemState?.update(this, elapsedMillis)

    }

    draw(ctx: CanvasRenderingContext2D) {

        if (this.asset === null) throw "Asset is null";
        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

}
