import AssetHandler from "./AssetHandler";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState } from "./types";
import { Egg } from "./Egg";

const MARIO_STARTING_POS: Point = { y: 135 - 48, x: -6 };

interface MarioState {
    handleInput: (mario: Mario, elapsedMillis: number, keys: KeyState) => void;
    update: (mario: Mario, elapsedMillis: number, collisions: Collision[]) => void;
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
            mario.movingState = new MarioJumpingState(this.direction, elapsedMillis);
        } else if (keys["s"] && false) {
            mario.movingState = new MarioPickingState();
            // TODO 
        }
    }

    update(mario: Mario, _: number, collisions: Collision[]) {
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
    private direction: "right" | "left";
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
            mario.movingState = new MarioJumpingState(this.direction, elapsedMillis);
        } else if (keys["s"] && false) {
            // TODO: Picking state
        }
    }

    update(mario: Mario, elapsedMillis: number, collisions: Collision[]) {
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

    private jumpStartMillis: number;
    private direction: "right" | "left";


    constructor(direction: "right" | "left", elapsedMillis: number) {
        this.jumpStartMillis = elapsedMillis;
        this.direction = direction;

    }

    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["a"] && !keys["d"]) {
            mario.vel.x = -1;
        } else if (keys["d"] && !keys["a"]) {
            mario.vel.x = 1;
        }
    }

    update(mario: Mario, elapsedMillis: number, collisions: Collision[]) {
        mario.asset = this.getAsset(mario);

        mario.pos.x += mario.vel.x;

        const marioPosY = this.getJumpPos(elapsedMillis - this.jumpStartMillis);

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
        return Math.round(MARIO_STARTING_POS.y - (50 * t - 10 * Math.pow(t, 2)));
    }

}

/**
 * Mario's falling state. 
 * 
 * Transitions: 
 * - After falling is done -> MarioIdleState
 */
class MarioFallingState implements MarioState {
    private direction: "right" | "left";

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
        /// TODO FALLING UPDATE OF y pos 
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
    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["s"] || keys["a"]) {
            // Set to walking state
        }
    }

    update(mario: Mario, elapsedMillis: number, collisions: Collision[]) {
        mario.asset = this.getAsset();
    }

    private getAsset() {

        const assetHandler = AssetHandler.getInstance();
        return assetHandler.get("lift-0");
    }
}

class MarioHoldingItemState implements MarioState {
    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["s"] || keys["a"]) {
            // Set to walking state
        }
    }

    update(mario: Mario, elapsedMillis: number, collisions: Collision[]) {
    }
}

class MarioThrowingItemState implements MarioState {
    handleInput(mario: Mario, elapsedMillis: number, keys: KeyState) {
        if (keys["s"] || keys["a"]) {
            // Set to walking state
        }
    }

    update(mario: Mario, elapsedMillis: number, collisions: Collision[]) {
    }
}


/**

 * PICKING STATE
 * 
 * Transitions (When pick animation is done -> goes back to idle but also initializes a holding state from state machine2)

 * State machine 2
 * 
 * NO HOLDING
 * 
 * Transitions (When picking is done in state machine 1 -> Holding state)
 * 
 * HOLDING STATE
 * 
 * Transitions (When press ö -> throwing state)
 * 
 * THROWING STATE
 * 
 * Transitions (When throw time is done -> NO HOLDING)
 */

export class Mario implements GameObject {

    kind: GameObjectKind = GameObjectKind.MARIO;

    pos: Point;
    vel: Point;
    movingState: MarioState;
    itemState: MarioState | null;
    asset: HTMLImageElement | null;

    private lives: number;

    private egg: Egg | null;

    constructor() {

        this.pos = { ...MARIO_STARTING_POS };
        this.vel = { x: 0, y: 0 };
        this.movingState = new MarioIdleState("right");
        this.itemState = null;

        this.lives = 5;
        this.egg = null;
        this.asset = null;

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
        return { y1: this.pos.y, x1: this.pos.x, x2: this.pos.x + 32, y2: this.pos.y + 48 }
    }

    update(elapsedMillis: number, keys: KeyState, collisions: Collision[]) {
        this.movingState.handleInput(this, elapsedMillis, keys);

        this.movingState.update(this, elapsedMillis, collisions);
    }

    draw(ctx: CanvasRenderingContext2D) {

        if (this.asset === null) throw "Asset is null";
        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

    private updateStateBasedOnCollision(collisions: Collision[]) {

        /*      let isCollidingWithEgg = false;
     
             if (collisions.length > 0) {
                 for (const collision of collisions) {
     
                     switch (collision.obj.kind) {
                         case GameObjectKind.DRAGON:
                             break;
                         case GameObjectKind.EGG:

                         // IF colliding with an egg below himself and is not in picking state and is not in holding state, he is colldigin with egg in a way that he should stand on the egg. 
                         // this means that the y value of the mario is the egg's y value and the x value should be updated according to the eggs value. 

                         // When mario is then picking up the egg he is in a picking state where he should show a certain image for 1 second then he is not colliding with the egg no more and the x value is still.
                         // When mario has picked the egg up he is in a holding item and falling state where his y value is gradually increasing and the image shown is holding the egg. The egg must now be placed on top of mario. So the egg is now controlled by mario. 
                         // Before the mario was 'controlled' by the egg. 
     
                             if (!this.isPickingItem() && !this.isHoldingItem()) {
     
                                 isCollidingWithEgg = true;
                                 if (collision.collisionPoint === "south") {
                                     if (!this.isStandingOnEgg()) {
                                         if (this.isJumping()) this.state -= MarioState.JUMPING;
     
                                         this.state = MarioState.STANDING_ON_EGG;
                                         this.pos.y = collision.obj.pos.y - 46;
                                         this.vel = collision.obj.vel;
                                         this.egg = collision.obj as Egg;
                                     }
     
                                 } else {
                                     this.lives -= 1;
     
                                 }
                             }
                             break;
                         case GameObjectKind.MARIO:
                             // Can't be itself
                             break;
                     }
                 }
             }
     
             if (!isCollidingWithEgg && !this.isPickingItem() && (this.isStandingOnEgg())) {
     
                 if (this.isStandingOnEgg()) {
                     this.state -= MarioState.STANDING_ON_EGG;
                 }
     
                 this.state += MarioState.FALLING;
                 this.vel = { x: 1, y: 3 };
     
             } */
    }

}
