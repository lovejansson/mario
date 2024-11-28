import AssetManager from "../AssetManager";
import { Mario, MARIO_STARTING_POS } from "./Mario";
import AudioPlayer from "../AudioPlayer";
import { Egg } from "../Egg";
import { GameState } from "../types";
import { setGameState } from "../globalState";

export interface MarioState {
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
export class MarioIdleState implements MarioState {
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
export class MarioDamageState implements MarioState {

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
export class MarioWalkingState implements MarioState {

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
export class MarioJumpingState implements MarioState {

    private flipFlop: boolean;
    private frames: number;

    constructor() {
        this.flipFlop = true;
        AudioPlayer.getInstance().playAudio("mario-jump");
        this.frames = 0;
    }

    update(mario: Mario, _: number) {

        mario.vel.x = mario.direction === "right" ? 1 : -1;
        mario.asset = this.getAsset(mario);

        this.frames++;

        // Determine velocity y

        const g = 1;
        const vi = -14;

        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
        mario.vel.y = vi + (g * this.frames);


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
export class MarioFallingState implements MarioState {
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

export class MarioPickingState implements MarioState {

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

export class MarioHoldingItemState implements MarioState {

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
        this.egg.throw(mario.direction === "right" ? (mario.isStandingOnPlatform ? 2 : 8) : (mario.isStandingOnPlatform ? -2 : -8));
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
 * Will basically just keep information about the egg that mario could be standing on
 * 
 */
export class MarioStandingOnEggState implements MarioState {
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

export class MarioThrowingItemState implements MarioState {
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

    update(mario: Mario) {

        mario.asset = this.getAsset(mario)

        const vi = 0;
        const g = 0.2;

        mario.vel.y = vi + (g * this.frame);


        const marioPosY = mario.pos.y + mario.vel.y;
        this.flipFlop = !this.flipFlop;

        mario.vel.x = -1;

        // Has fallen off screen
        if (marioPosY > 2000) {
            setGameState(GameState.PAUSE);

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
    }

    private getAsset() {
        const assetHandler = AssetManager.getInstance();
        return assetHandler.get("winning");
    }
}
