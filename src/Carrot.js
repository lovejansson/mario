import Phaser, { Scene } from "phaser";
import { Birdo } from "./Birdo";
import Sprite from "./Sprite";

const CarrotState = {
    GROUNDED: 0,
    PICKED_UP: 1,
    THROWED: 2,
    DROPPED: 3,
    COLLIDED: 4
}

export class Carrot extends Sprite {

    /**
     * @param {Scene} scene 
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     */
    constructor(scene, pos, width, height, image) {
        super(scene, pos, width, height, image);
 
        this.id = "carrot" + Math.random();
        this.state = CarrotState.GROUNDED;
    }

    isThrowed() {
        return this.state === CarrotState.THROWED;
    }

    pickUp() {
        this.setTexture(`carrot-${Math.random() > 0.5 ? "white" : "orange"}`);
        this.setSize(18, 20);
    }

    drop(direction) {
        this.state = CarrotState.DROPPED;

        this.dynamicBody.checkCollision.none = true; // Disable collisions so that it can just drop out of view.

        this.setGravityY(200);
        this.setVelocityX(direction === "right" ? 50 : -50);
    }

    throw(direction) {
        // Carrot will move slightly upwards and to the right or left depending on direction, but then be pulled down by gravity 
        this.setGravityY(2);
        this.setVelocityY(-100);
        this.setVelocityX(direction === "right" ? 400 : -400);

        this.state = CarrotState.THROWED;
    }

    handleCollision(obj) {

        if (obj instanceof Birdo) {
            if (this.state === CarrotState.THROWED) {

                this.state = CarrotState.COLLIDED;

                this.dynamicBody.checkCollision.none = true; // turn off collisions from now on and let carrot bounce out of view. 

                // Carrot will move slightly upwards and to the right or left depending on collision side, but then be pulled down by gravity 
                this.setGravityY(400);
                this.setVelocityY(-100);
                this.setVelocityX(this.dynamicBody.touching.right ? -150 : 150);
            }

        }

    }

    update() {
        //
    }
}