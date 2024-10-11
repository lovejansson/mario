import AssetHandler from "./AssetHandler";
import { Egg, EggState } from "./Egg";
import { gameObjects } from "./globalState";
import { Mario } from "./Mario";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState } from "./types";


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
    private flipFlop: boolean;

    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillis = 0;
        this.flipFlop = false;
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

        dragon.asset = assetHandler.get(`dragon-0${dragon.damageState ? this.flipFlop ? "-damage0" : "-damage1" : ""}`)


        if (dragon.damageState) {
            this.flipFlop = !this.flipFlop;
        }
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
    private flipFlop: boolean;

    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillis = 0;
        this.flipFlop = false;
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
        dragon.asset = assetHandler.get(`dragon-0${dragon.damageState ? this.flipFlop ? "-damage0" : "-damage1" : ""}`)

        if (dragon.damageState) {
            this.flipFlop = !this.flipFlop;
        }
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
    private flipFlop: boolean;

    constructor() {
        this.frame = 0;
        this.flipFlop = false;

    }
    update(dragon: Dragon, elapsedMillis: number) {

        dragon.vel.x = 0;

        // Determine velocity y

        const g = 1;
        const vi = -6;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls dragon 1 pixel downwards. t is the number of frames. 
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
        dragon.asset = assetHandler.get(`dragon-0${dragon.damageState ? this.flipFlop ? "-damage0" : "-damage1" : ""}`)


        if (dragon.damageState) {
            this.flipFlop = !this.flipFlop;
        }

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

    private flipFlop: boolean;

    constructor(elapsedMillis: number) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillis = 0;
        this.hasShotEgg = false;
        this.flipFlop = false;
    }

    update(dragon: Dragon, elapsedMillis: number) {

        const assetHandler = AssetHandler.getInstance();

        dragon.asset = assetHandler.get(`dragon-1${dragon.damageState ? this.flipFlop ? "-damage0" : "-damage1" : ""}`)



        if (dragon.damageState) {
            this.flipFlop = !this.flipFlop;
        }

        this.elapsedMillis += (elapsedMillis - this.prevMillis!);
        this.prevMillis = elapsedMillis;

        if (!this.hasShotEgg) {
            setTimeout(() => {
                const egg = new Egg(dragon.pos.x - 4, dragon.pos.y + 14);
                gameObjects.push(egg);
                dragon.shootingState = null;
            }, 250)

            this.hasShotEgg = true;
        } else {
            if (this.elapsedMillis >= 1500) {
                dragon.movingState = new DragonWalkingState(elapsedMillis);
            }
        }

    };
}


class DragonDyingState implements DragonState {
    frame: number;
    private flipFlop: boolean;

    constructor() {
        this.frame = 0;
        this.flipFlop = false;
    }
    handleInput(dragon: Dragon, elapsedMillis: number, keys: KeyState) {


    }

    update(dragon: Dragon, elapsedMillis: number) {

        dragon.vel.x = -1;

        dragon.asset = this.getAsset(dragon)

        this.flipFlop = !this.flipFlop;

        const vi = 0;
        const g = 0.2;

        dragon.vel.y = vi + (g * this.frame);

        const dragonPosY = dragon.pos.y + dragon.vel.y;

        // Has fallen off screen
        if (dragonPosY > 1000) {
            // Falling is done
            dragon.pos.y = START_POS.y;
            dragon.pos.x = START_POS.x;
            dragon.vel.y = 0;
            dragon.vel.x = 0;

            dragon.movingState = new DragonIdleState(elapsedMillis)
            dragon.lives = 2;
        } else {
            dragon.pos.y = dragonPosY;
            dragon.pos.x += dragon.vel.x;
            this.frame++;
        }

    }

    private getAsset(dragon: Dragon) {
        const assetHandler = AssetHandler.getInstance();

        return assetHandler.get(`dragon-0${dragon.damageState ? this.flipFlop ? "-damage0" : "-damage1" : ""}`)
    }
}

class DragonWinningState implements DragonState {



    handleInput(dragon: Dragon, elapsedMillis: number, keys: KeyState) {
        // Nothing can happen based on input
    }

    update(dragon: Dragon, elapsedMillis: number) {

        // Should just show winning asset until dragon has fallen off screen

        dragon.asset = this.getAsset(dragon);

        const mario = gameObjects.find(obj => obj instanceof Mario);

        if (mario && mario.hasDied()) {
            dragon.movingState = new DragonIdleState(elapsedMillis);
        }
    }

    private getAsset(dragon: Dragon) {
        const assetHandler = AssetHandler.getInstance();
        return assetHandler.get(`dragon-0`)
    }
}


class DragonDamagedState implements DragonState {

    private prevMillis: number;
    private elapsedMillisDiff: number;


    constructor(elapsedMillis: number,) {
        this.prevMillis = elapsedMillis;
        this.elapsedMillisDiff = 0;

    }

    handleInput(dragon: Dragon, elapsedMillis: number, keys: KeyState) {
        // Nothing can happen based on input
    }

    update(dragon: Dragon, elapsedMillis: number) {
        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        if (this.elapsedMillisDiff >= 500) {
            dragon.damageState = null;
        }

    }
}


export class Dragon implements GameObject {
    id: string;
    kind: GameObjectKind = GameObjectKind.DRAGON;
    pos: Point;
    vel: Point;
    lives: number;

    movingState: DragonState;
    shootingState: DragonState | null;
    damageState: DragonState | null;
    asset: HTMLImageElement | null;

    constructor() {
        this.pos = { ...START_POS };
        this.vel = { x: 0, y: 0 };
        this.movingState = new DragonIdleState(0);
        this.shootingState = null;
        this.damageState = null;
        this.asset = null;
        this.id = "dragon";
        this.lives = 2;
    }

    init() {
        const assetHandler = AssetHandler.getInstance();
        assetHandler.register("dragon-0", "./assets/dragon-0.png");
        assetHandler.register("dragon-1", "./assets/dragon-1.png");
        assetHandler.register("dragon-0-damage1", "./assets/dragon-0-damage1.png");
        assetHandler.register("dragon-1-damage1", "./assets/dragon-1-damage1.png");
        assetHandler.register("dragon-0-damage0", "./assets/dragon-0-damage0.png");
        assetHandler.register("dragon-1-damage0", "./assets/dragon-1-damage0.png");
        assetHandler.register("egg", "./assets/egg.png");
    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y + 2, x: this.pos.x + 7, w: 24, h: 45 }
    }

    update(elapsedMillis: number, _: KeyState, collisions: Collision[]) {
        this.checkCollisions(collisions, elapsedMillis);

        if (!(this.movingState instanceof DragonDyingState) && !(this.movingState instanceof DragonWinningState)) this.checkGameState();


        this.movingState.update(this, elapsedMillis);

        if (this.damageState) {
            this.damageState.update(this, elapsedMillis)
        }
    }

    checkGameState() {
        if (this.lives === 0) {
            this.movingState = new DragonDyingState();
            return;
        }

        const mario = gameObjects.find(obj => obj instanceof Mario);

        if (mario && mario.lives === 0) {
            this.movingState = new DragonWinningState();
        }
    }

    hasDied() {
        return !(this.movingState instanceof DragonDyingState)
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.asset === null) throw "Asset is null";
        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

    private checkCollisions(collisions: Collision[], elapsedMillis: number) {
        for (const c of collisions) {

            // If the collision is an egg that has been throwed at the dragon
            if (c.obj instanceof Egg) {
                if (c.obj.state === EggState.THROWED) {
                    this.damageState = new DragonDamagedState(elapsedMillis);
                    this.lives -= 1;
                }
            }
        }
    }

}

