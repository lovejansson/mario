import AssetHandler from "./AssetHandler";
import { Egg } from "./Egg";
import { gameObjects } from "./globalState";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState, ConnectedObjects } from "./types";


const START_POS: Point = { y: 135 - 47, x: 250 };

interface DragonState {
    update: (dragon: Dragon, elapsedMillis: number) => void;
}

/**
 * Dragon's idle state
 * 
 * Transitions:
 * - After some amount of milliseconds -> DragonWalkingState
 */
class DragonIdleState implements DragonState {
    private prevMillis: number;
    private elapsedMillis: number;

    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillis = 0;
    }

    update(dragon: Dragon, elapsedMillis: number) {


        this.elapsedMillis += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;


        // Stop idle state after 1500 ms
        if (this.elapsedMillis >= 1500) {

            if (dragon.pos.x < START_POS.x) {
                dragon.movingState = new DragonShootingState(elapsedMillis);
            } else {
                dragon.movingState = new DragonWalkingState(elapsedMillis);
            }
        }

        const assetHandler = AssetHandler.getInstance();

        dragon.asset = assetHandler.get("dragon-0")
    };
}

/**
 * Dragon's walking state
 * 
 * Transitions:
 * - After some amount of milliseconds -> either DragonIdleState or DragonJumpState based on direction
 */
class DragonWalkingState implements DragonState {

    private prevMillis: number;
    private elapsedMillis: number;

    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillis = 0;
    }

    update(dragon: Dragon, elapsedMillis: number) {

        if (this.elapsedMillis === 0) {
            if (dragon.pos.x >= START_POS.x) {
                dragon.vel.x = -1;
            } else {
                dragon.vel.x = 1;
            }
        }
        this.elapsedMillis += (elapsedMillis - this.prevMillis!);
        this.prevMillis = elapsedMillis;

        dragon.pos.x += dragon.vel.x;

        // Stop walking state after 500 ms and transition to either JUMPING or IDLE
        if (this.elapsedMillis >= 500) {

            // If the dragon moves backwards it is supposed to do a little jump
            if (dragon.vel.x === 1) {
                dragon.movingState = new DragonJumpingState();

                // When dragon moves forward it is supposed to stop and shoot an egg
            } else {
                dragon.movingState = new DragonIdleState(elapsedMillis);
            }
        }

        const assetHandler = AssetHandler.getInstance();
        dragon.asset = assetHandler.get("dragon-0")
    }

};


/**
 * Dragon's jumping state
 * 
 * Transitions:
 * - After jump is done -> DragonJumpingState
 */
class DragonJumpingState implements DragonState {

    private frame: number;

    constructor() {
        this.frame = 0;

    }
    update(dragon: Dragon, elapsedMillis: number) {

        dragon.vel.x = 0;

        // Determine velocity y

        const g = 1;
        const vi = -6;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
        dragon.vel.y = vi + (g * this.frame);

        const y = dragon.pos.y + dragon.vel.y;

        if (y > START_POS.y) {
            // Jump is done
            dragon.movingState = new DragonIdleState(elapsedMillis);
            dragon.pos.y = START_POS.y;
            dragon.vel.y = 0;

        } else {
            dragon.pos.y = y;
            this.frame++;
        }


        const assetHandler = AssetHandler.getInstance();

        dragon.asset = assetHandler.get("dragon-0")
    };
}


/**
 * Dragon's shooting state
 * 
 * Transitions:
 * - After has hot egg and some amount of time has elapsed -> DragonWalkingState
 */
class DragonShootingState implements DragonState {

    private prevMillis: number;
    private elapsedMillis: number;

    private hasShotEgg: boolean;

    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillis = 0;
        this.hasShotEgg = false;
    }

    update(dragon: Dragon, elapsedMillis: number) {

        const assetHandler = AssetHandler.getInstance();

        dragon.asset = assetHandler.get("dragon-1");

        this.elapsedMillis += (elapsedMillis - this.prevMillis!);
        this.prevMillis = elapsedMillis;


        if (!this.hasShotEgg) {
            setTimeout(() => {

                const egg = new Egg(dragon.pos.x - 4, dragon.pos.y + 14);

                gameObjects.push(egg);
            }, 250)

            this.hasShotEgg = true;
        } else {
            if (this.elapsedMillis >= 1500) {
                dragon.movingState = new DragonWalkingState(elapsedMillis);
            }
        }

    };
}

class DragonHurtingState implements DragonState {
    update(dragon: Dragon, elapsedMillis: number) {
        const assetHandler = AssetHandler.getInstance();
        dragon.asset = assetHandler.get("dragon-0")
    };
}


export class Dragon implements GameObject {
    id: string;
    kind: GameObjectKind = GameObjectKind.DRAGON;
    pos: Point;
    vel: Point;

    movingState: DragonState;
    shootingState: DragonState | null;
    asset: HTMLImageElement | null;

    constructor() {
        this.pos = { ...START_POS };
        this.vel = { x: 0, y: 0 };
        this.movingState = new DragonIdleState(0);
        this.shootingState = null;
        this.asset = null;
        this.id = "dragon";
    }

    init() {
        const assetHandler = AssetHandler.getInstance();
        assetHandler.register("dragon-0", "./assets/dragon-0.png");
        assetHandler.register("dragon-1", "./assets/dragon-1.png");
        assetHandler.register("egg", "./assets/egg.png");
    }

    getCollisionBox(): CollisionBox {
        return { y1: this.pos.y, x1: this.pos.x, x2: this.pos.x + 32, y2: this.pos.y + 48 }
    }

    update(elapsedMillis: number, _: KeyState, collisions: Collision[], connections: ConnectedObjects) {
        this.movingState.update(this, elapsedMillis);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.asset === null) throw "Asset is null";
        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

}

