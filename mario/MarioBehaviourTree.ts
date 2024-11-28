import { gameObjects } from "../globalState";
import { Mario } from "./Mario";
import Counter from "./Counter";
import { MarioFallingState, MarioHoldingItemState, MarioIdleState, MarioJumpingState, MarioPickingState, MarioState, MarioWalkingState } from "./MarioState";
import { Platform } from "../Platform";
import { Egg, EggState } from "../Egg";

export default class MarioBehaviourTree {

    private mario: Mario;
    private movingStateCounter: Counter;

    constructor(mario: Mario) {
        this.mario = mario;
        this.movingStateCounter = new Counter();
    }


    private isBlockingActionRunning() {
        return this.mario.movingState instanceof MarioJumpingState || this.mario.movingState instanceof MarioPickingState || this.mario.movingState instanceof MarioFallingState;
    }

    private isCloseToTheRightEdgeOfPlatform() {
        const platform = gameObjects.find(obj => obj instanceof Platform);
        if (!platform) throw "Internal error platform should exist";

        const marioBox = this.mario.getCollisionBox();
        const platformBox = platform.getCollisionBox();

        return marioBox.x > platformBox.x + platformBox.w - marioBox.w / 2 && this.mario.direction === "right";
    }

    private isCloseToTheLeftEdgeOfPlatform() {

        const platform = gameObjects.find(obj => obj instanceof Platform);
        if (!platform) throw "Internal error platform should exist";

        const marioBox = this.mario.getCollisionBox();
        const platformBox = platform.getCollisionBox();

        return marioBox.x < platformBox.x - 8 && this.mario.direction === "left"
    }


    private canJumpOntoEgg() {

        const egg = gameObjects.find(o => o instanceof Egg && o.state === EggState.FLYING);

        if (!egg) return false;

        const marioBox = this.mario.getCollisionBox();
        const eggBox = egg.getCollisionBox();

        const diffBetweenMarioAndEgg = eggBox.x - (marioBox.x + marioBox.w);
        // Egg is to the right or infront of mario
        return diffBetweenMarioAndEgg <= 25 && diffBetweenMarioAndEgg > 0;
    }


    private isCloseToRight(objectType: string, diff: number) {

        const obj = gameObjects.find(o => o.type === objectType);

        if (!obj) {
            return false;
        }

        const marioBox = this.mario.getCollisionBox();
        const objBox = obj.getCollisionBox();

        const diffBetweenMarioAndObject = objBox.x - (marioBox.x + marioBox.w);

        return diffBetweenMarioAndObject <= diff && diffBetweenMarioAndObject > 0;
    }

    private setMarioMovingState(state: MarioState) {
        this.movingStateCounter.reset();
        this.mario.movingState = state;
    }

    evaluate() {

        this.movingStateCounter.tick();

        if (!this.isBlockingActionRunning()) {

            // When holding an egg the main goal is to throw the egg at birdo
            if (this.mario.itemState instanceof MarioHoldingItemState) {

                if (this.isCloseToRight("birdo", 50)) {
                    this.mario.itemState.throwEgg(this.mario);

                    this.mario.direction = "left";

                } else if (this.mario.isStandingOnPlatform) {

                    if (this.isCloseToTheLeftEdgeOfPlatform()) {
                        this.setMarioMovingState(new MarioJumpingState());
                        this.mario.direction = "left";

                    } else if (this.isCloseToTheRightEdgeOfPlatform()) {
                        this.setMarioMovingState(new MarioJumpingState());
                        this.mario.direction = "right";
                    } else if (this.movingStateCounter.frames > 50) {
                        if (this.mario.movingState instanceof MarioWalkingState) {
                            this.setMarioMovingState(new MarioIdleState());
                        } else {
                            this.setMarioMovingState(new MarioWalkingState());
                            this.mario.direction = Math.random() > 0.5 ? "right" : "left";
                        }
                    }


                } else if (this.isCloseToRight("platform", 5) && Math.random() > 0.75) {
                    this.setMarioMovingState(new MarioJumpingState());
                    this.mario.direction = "right";

                } else if (this.canJumpOntoEgg() && Math.random() > 0.75) {
                    this.setMarioMovingState(new MarioJumpingState());
                    this.mario.direction = "right";

                } else {

                    // Walk towards birdo

                    if (!(this.mario.movingState instanceof MarioWalkingState)) {
                        this.setMarioMovingState(new MarioWalkingState());
                    }

                    if (this.mario.direction !== "right") {
                        this.mario.direction = "right";
                    }
                }

                // When not holding an egg, the main goal is to catch an egg
            } else {

                if (this.mario.standingOnEggState !== null) {

                    if (this.movingStateCounter.frames > 25) {
                        this.setMarioMovingState(new MarioPickingState());
                        this.mario.standingOnEggState!.getEgg().pickUp();
                    }
                } else if (this.mario.isStandingOnPlatform) {

                    // Alternate between walking and standing idle for 50 frames and if close to any edge check if can jump down 

                    if (this.isCloseToTheLeftEdgeOfPlatform()) {
                        this.setMarioMovingState(new MarioJumpingState());
                        this.mario.direction = "left";
                    } else if (this.isCloseToTheRightEdgeOfPlatform()) {

                        if (!this.isCloseToRight("birdo", 75)) {
                            this.setMarioMovingState(new MarioJumpingState());
                            this.mario.direction = "right";
                        } else {
                            this.setMarioMovingState(new MarioWalkingState());
                            this.mario.direction = "left";
                        }

                    } else if (this.movingStateCounter.frames >= 50) {
                        if (this.mario.movingState instanceof MarioWalkingState) {
                            this.setMarioMovingState(new MarioIdleState());
                        } else {
                            this.setMarioMovingState(new MarioWalkingState());
                            this.mario.direction = Math.random() > 0.5 ? "right" : "left";
                        }
                    }

                } else if (this.canJumpOntoEgg()) {
                    this.setMarioMovingState(new MarioJumpingState());
                    this.mario.direction = "right";

                } else if (this.isCloseToRight("birdo", 20)) {

                    if (!(this.mario.movingState instanceof MarioWalkingState)) {
                        this.setMarioMovingState(new MarioWalkingState());
                    }

                    this.mario.direction = "left";

                }
                else if (this.isCloseToRight("platform", 5)) {

                    if (Math.random() > 0.5) {
                        this.setMarioMovingState(new MarioJumpingState());
                        this.mario.direction = "right";
                    }

                } else if (this.movingStateCounter.frames >= 100) {

                    if (this.mario.movingState instanceof MarioWalkingState) {
                        this.setMarioMovingState(new MarioIdleState());

                        this.mario.direction = "right";
                    } else {
                        this.setMarioMovingState(new MarioWalkingState());

                        this.mario.direction = "right";
                    }
                }
            }
        }
    }
}