import Sprite from "./Sprite.js";
import { FightingState } from "./Fighting.js";
import { NotImplementedError } from "./error.js";

/**
 * @typedef {import("./Scene.js").default} Scene
 */

/**
 * @typedef {import("./collision.js").CollisionResult} CollisionResult
 */

class EggState {

    /**
     * @param {Egg} egg 
     */
    update(egg) {
        throw new NotImplementedError("EggState", "update");
    }
}

class CollidedState extends EggState {
    constructor(direction) {
        super();
        this.direction = direction;
        this.velX = direction === "right" ? 2 : -2;
        this.frame = 0;
    }

    /**
     * @param {Egg} egg 
     */
    update(egg) {
  
        const g = 1;
        const vi = -4;
 
        // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
        egg.vel.y = vi + (g * this.frame);

        egg.vel.x = this.velX;

        egg.pos.y = egg.pos.y + egg.vel.y;
        egg.pos.x = egg.vel.x;

        this.frame++;

    }
}

class FlyingState extends EggState {

    constructor(direction) {
        super();
        this.direction = direction;
        this.velX = direction === "right" ? 2 : -2;
    }

    /**
     * @param {Egg} egg 
     */
    update(egg) {
        egg.pos.x += this.velX;
    }
}

class ThrowedState extends EggState {
    constructor(direction) {
        super();
        this.direction = direction;
        this.velX = direction === "right" ? 2 : -2;
        this.frame = 0;
    }

   /**
     * @param {Egg} egg 
     */
    update(egg) {
  
        const g = 1;
        const vi = -4;
 
        // Calculates the velocity vf = vi + at where vi is the initial velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
        egg.vel.y = vi + (g * this.frame);

        egg.vel.x = this.velX;

        egg.pos.y = egg.pos.y + egg.vel.y;
        egg.pos.x = egg.vel.x;

        this.frame++;

    }
}

class DroppedState extends EggState {

    /**
     * @param {Egg} egg 
     */
    update(egg) {
        egg.pos.y += 1;
    }
}

export class Egg extends Sprite {

     /**
     * @param {Scene} scene 
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string | undefined} image 
     * @param {"right" | "left"} direction 
     */
    constructor(scene, pos, width, height, image, direction) {
        super(scene, pos, width, height, image);

        this.state = new FlyingState(direction);
        this.marioIsStandingOnMe = false;
        this.marioIsHoldingMe = false;
    }

    standOn() {
        this.marioIsStandingOnMe = true;
    }

    pickUp() {
        this.marioIsHoldingMe = true;
    }

    throw(direction) {
        this.state = new ThrowedState(direction);
    }

    update(collisions) {

        for(const c of collisions) {
            if (c.obj instanceof Birdo && this.state instanceof ThrowedState || (c.obj instanceof Mario && this.state instanceof FlyingState)) {
                this.state = new CollidedState(c.blocked.right ? "left" : "right");
            }
        }

        if (this.scene.state !== FightingState.FIGHTING) {
            this.state = new DroppedState();
        } 

        this.state.update();

        // Draw call in Sprite class
    }

}