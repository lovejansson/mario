import AssetManager from "./AssetManager";
import AudioPlayer from "./AudioPlayer";
import { Egg, EggState } from "./Egg";
import { gameObjects, gameState, setGameState } from "./globalState";
import { GameObject, Collision, CollisionBox, Point, GameState } from "./types";


const START_POS: Point = { y: 148 - 47, x: 250 };

interface BirdoState {
    update: (birdo: Birdo, elapsedMillis: number) => void;
}

/**
 * Birdo's intro state
 * 
 * Transitions:
 * - Into Idle state when game state switches to fighting
 */
class BirdoIntroState implements BirdoState {

    private hasPlayedAudio: boolean;

    constructor() {
        this.hasPlayedAudio = false;
    }

    update(birdo: Birdo, _: number) {

        if (!this.hasPlayedAudio) {
            AudioPlayer.getInstance().playAudio("birdo-intro");
            this.hasPlayedAudio = true;
        }

        if (gameState === GameState.FIGHTING) birdo.state = new BirdoIdleState()

        birdo.pos.x = START_POS.x;
        birdo.pos.y = START_POS.y;

        const assetManager = AssetManager.getInstance();

        birdo.asset = assetManager.get(`birdo-0`);

    };
}


/**
 * Birdo's idle state
 * 
 * Transitions:
 * - After some amount of milliseconds -> BirdoWalkingState
 */
class BirdoIdleState implements BirdoState {
    private prevMillis: number | null;
    private elapsedMillis: number;

    constructor() {
        this.prevMillis = null;
        this.elapsedMillis = 0;
    }

    update(birdo: Birdo, elapsedMillis: number) {

        if (this.prevMillis === null) {
            this.prevMillis = elapsedMillis;
        }

        this.elapsedMillis += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;


        const assetManager = AssetManager.getInstance();

        birdo.asset = assetManager.get(`birdo-0`);

        if (this.elapsedMillis >= 1500) {

            if (birdo.pos.x < START_POS.x) {
                birdo.state = new BirdoShootingState();
            } else {
                birdo.state = new BirdoWalkingState();
            }
        }

    };
}

/**
 * Birdo's walking state
 * 
 * Transitions:
 * - After some amount of milliseconds -> either BirdoIdleState or BirdoJumpState based on direction
 */
class BirdoWalkingState implements BirdoState {

    private prevMillis: number | null;
    private elapsedMillisWalk: number;
    private elapsedMillis: number;
    private walkFrame: 0 | 1;

    constructor() {
        this.prevMillis = null;
        this.elapsedMillis = 0;
        this.elapsedMillisWalk = 0;
        this.walkFrame = 0;
    }

    update(birdo: Birdo, elapsedMillis: number) {


        if (this.prevMillis === null) {
            this.prevMillis = elapsedMillis;
        }

        if (this.elapsedMillis === 0) {
            if (birdo.pos.x >= START_POS.x) {
                birdo.vel.x = -1;
            } else {
                birdo.vel.x = 1;
            }
        }

        this.elapsedMillis += (elapsedMillis - this.prevMillis);
        this.elapsedMillisWalk += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        birdo.pos.x += birdo.vel.x;

        if (this.elapsedMillisWalk >= 100) {
            this.walkFrame = this.walkFrame === 0 ? 1 : 0;
            this.elapsedMillisWalk = 0;
        }

        const assetManager = AssetManager.getInstance();
        birdo.asset = assetManager.get(`birdo-walk-${this.walkFrame}`);

        // Stop walking state after 500 ms and transition to either JUMPING or IDLE
        if (this.elapsedMillis >= 500) {

            // If the birdo moves backwards it is supposed to do a little jump
            if (birdo.vel.x === 1) {
                birdo.state = new BirdoJumpingState();

                // When birdo moves forward it is supposed to stop and shoot an egg
            } else {
                birdo.state = new BirdoIdleState();
            }
        }



    }

};


/**
 * Birdo's jumping state
 * 
 * Transitions:
 * - After jump is done -> BirdoJumpingState
 */
class BirdoJumpingState implements BirdoState {

    private frame: number;

    constructor() {
        this.frame = 0;
    }
    update(birdo: Birdo, _: number) {

        birdo.vel.x = 0;

        // Determine velocity y

        const g = 1;
        const vi = -6;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls birdo 1 pixel downwards. t is the number of frames. 
        birdo.vel.y = vi + (g * this.frame);

        const y = birdo.pos.y + birdo.vel.y;

        const assetManager = AssetManager.getInstance();
        birdo.asset = assetManager.get(`birdo-0`)


        if (y > START_POS.y) {
            // Jump is done
            birdo.state = new BirdoIdleState();
            birdo.pos.y = START_POS.y;
            birdo.vel.y = 0;

        } else {
            birdo.pos.y = y;
            this.frame++;
        }

    };
}


/**
 * Birdo's shooting state
 * 
 * Transitions:
 * - After has hot egg and some amount of time has elapsed -> BirdoWalkingState
 */
class BirdoShootingState implements BirdoState {

    private prevMillis: number | null;
    private elapsedMillis: number;

    private hasShotEgg: boolean;

    constructor() {
        this.prevMillis = null;
        this.elapsedMillis = 0;
        this.hasShotEgg = false;
    }

    update(birdo: Birdo, elapsedMillis: number) {

        if (this.prevMillis === null) {
            this.prevMillis = elapsedMillis;
        }

        const assetManager = AssetManager.getInstance();

        birdo.asset = assetManager.get(`birdo-1`);

        this.elapsedMillis += (elapsedMillis - this.prevMillis!);
        this.prevMillis = elapsedMillis;

        if (this.elapsedMillis > 250 && !this.hasShotEgg) {
            const egg = new Egg(birdo.pos.x - 4, birdo.pos.y + 14);
            gameObjects.push(egg);

            AudioPlayer.getInstance().playAudio("birdo-shoot-egg");
            this.hasShotEgg = true;

        } else if (this.elapsedMillis > 1500) {
            birdo.state = new BirdoWalkingState();
        }
    }
}


class BirdoDyingState implements BirdoState {
    frame: number;
    private flipFlop: boolean;

    constructor() {
        this.frame = 0;
        this.flipFlop = false;
    }

    update(birdo: Birdo, _: number) {

        birdo.asset = this.getAsset();

        const vi = 0;
        const g = 0.2;

        birdo.vel.y = vi + (g * this.frame);


        const birdoPosY = birdo.pos.y + birdo.vel.y;

        // Has fallen off screen
        if (birdoPosY > 2000) {
            // Falling is done
            birdo.pos.y = START_POS.y;

            birdo.pos.x = START_POS.x;
            birdo.vel.y = 0;
            birdo.vel.x = 0;

            setGameState(GameState.FIGHTING);

            birdo.state = new BirdoIdleState()
            birdo.lives = 5;
            // Keep falling out of screen
        } else {
            birdo.vel.x = 1;
            birdo.pos.y = birdoPosY;
            birdo.pos.x += birdo.vel.x;
            this.frame++;
        }
    }

    private getAsset() {
        const assetManager = AssetManager.getInstance();
        this.flipFlop = !this.flipFlop; // Creates flickering damage state by swapping two assets each draw
        return assetManager.get(`birdo-damage-${this.flipFlop ? "0" : "1"}`);
    }
}

class BirdoWinningState implements BirdoState {
    update(birdo: Birdo, _: number) {

        // Should just show winning asset until mario has fallen off screen

        birdo.asset = this.getAsset(birdo);

        if (gameState === GameState.FIGHTING) {

            birdo.state = new BirdoIdleState();
        }
    }

    private getAsset(_: Birdo) {
        const assetManager = AssetManager.getInstance();
        return assetManager.get(`birdo-0`);
    }
}


class BirdoHurtingState implements BirdoState {

    private prevMillis: number | null;
    private elapsedMillisDiff: number;
    private flipflop: boolean;
    private hasPlayedAudio: boolean;


    constructor() {
        this.prevMillis = null;
        this.elapsedMillisDiff = 0;
        this.flipflop = true;
        this.hasPlayedAudio = false;

    }

    update(birdo: Birdo, elapsedMillis: number) {

        if (!this.hasPlayedAudio) {
            AudioPlayer.getInstance().playAudio("birdo-hurting");
            this.hasPlayedAudio = true;
        }

        if (this.prevMillis === null) {
            this.prevMillis = elapsedMillis;
        }

        this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
        this.prevMillis = elapsedMillis;

        const assetManager = AssetManager.getInstance();

        this.flipflop = !this.flipflop;

        birdo.asset = this.flipflop ? assetManager.get("birdo-damage-0") : assetManager.get("birdo-damage-1");

        if (this.elapsedMillisDiff >= 500) {
            birdo.state = new BirdoIdleState();
        }
    }
}


export class Birdo implements GameObject {
    id: string;
    pos: Point;
    vel: Point;
    lives: number;

    state: BirdoState;
    asset: HTMLImageElement | null;

    constructor() {
        this.pos = { ...START_POS };
        this.vel = { x: 0, y: 0 };
        this.state = new BirdoIdleState();
        this.asset = null;
        this.id = "birdo";
        this.lives = 5;
    }

    init() {
        const assetManager = AssetManager.getInstance();
        assetManager.register("birdo-0", "./assets/images/birdo-0.png");
        assetManager.register("birdo-1", "./assets/images/birdo-1.png");

        assetManager.register("birdo-walk-0", "./assets/images/birdo-walk-0.png");
        assetManager.register("birdo-walk-1", "./assets/images/birdo-walk-1.png");

        assetManager.register("birdo-damage-0", "./assets/images/birdo-damage-0.png");
        assetManager.register("birdo-damage-1", "./assets/images/birdo-damage-1.png");
        assetManager.register("egg", "./assets/images/egg.png");

        const audioHandler = AudioPlayer.getInstance();

        audioHandler.createAudio("birdo-shoot-egg", "./assets/audio/birdo-shoot-egg.ogg");
        audioHandler.createAudio("birdo-hurting", "./assets/audio/birdo-hurt.ogg");
        audioHandler.createAudio("birdo-intro", "./assets/audio/birdo-intro.ogg");
    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y + 2, x: this.pos.x + 6, w: 24, h: 45 }
    }

    update(elapsedMillis: number, collisions: Collision[]) {

        if (gameState === GameState.FIGHTING) {
            // Check if birdo died
            if (this.lives === 0) {
                this.state = new BirdoDyingState();
                setGameState(GameState.MARIO_WON);
            } else {
                this.checkCollisions(collisions, elapsedMillis);
            }

        } else if (gameState === GameState.BIRDO_WON && !(this.state instanceof BirdoWinningState)) {
            this.state = new BirdoWinningState();
            this.pos.y = START_POS.y;
        }
        else if (gameState === GameState.INTRO) {
            if (!(this.state instanceof BirdoIntroState)) {
                this.state = new BirdoIntroState();
            }

        } else if (gameState === GameState.PAUSE) {
            this.state = new BirdoIdleState();

            this.pos.x = START_POS.x;
            this.pos.y = START_POS.y;
        }

        this.state.update(this, elapsedMillis);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.asset === null) throw "Asset is null";
        ctx.drawImage(this.asset, this.pos.x, this.pos.y);
    }

    private checkCollisions(collisions: Collision[], _: number) {
        for (const c of collisions) {

            // If the collision is an egg that has been throwed at the birdo
            if (c.obj instanceof Egg) {
                if (c.obj.state === EggState.THROWED && !(this.state instanceof BirdoHurtingState)) {
                    this.state = new BirdoHurtingState();
                    this.lives -= 1;
                }
            }
        }
    }

}

