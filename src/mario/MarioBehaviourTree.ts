
import { Mario } from "./Mario";
import { Egg, EggState } from "../Egg";
import { Fighting, WORLD_WIDTH } from "../scenes/Fighting";
import { Carrot, CarrotState } from "../Carrot";

enum GetItemGoalType {
    PICK_CARROT,
    CATCH_EGG,
}

type CatchEggGoal = {
    goal: GetItemGoalType.CATCH_EGG,
    birdoSide: "right" | "left"
}

type PickCarrotGoal = {
    goal: GetItemGoalType.PICK_CARROT,
    targetCarrot: Carrot,
}

type GetItemGoal = CatchEggGoal | PickCarrotGoal


export default class MarioBehaviourTree {

    private mario: Mario;
    private actionCounter: number;

    private getItemGoal: GetItemGoal;

    constructor(mario: Mario) {
        this.mario = mario;
        this.actionCounter = 0;
        this.getItemGoal = { goal: GetItemGoalType.PICK_CARROT, targetCarrot: this.selectRandomTargetCarrot()! };
    }

    evaluate() {

        this.actionCounter++;

        // Main goal is to throw the carrot at birdo
        if (this.mario.isHoldingCarrot()) {

            const direction = this.whereIsBirdo();

            const wishedBirdoDiff = 24 + Math.floor(Math.random() * 48);

            // When mario is between 2 widths to 3 width away from birdo he can throw
            if (this.isCloseToBirdo(direction, wishedBirdoDiff)) {
                this.mario.throw(direction);
                this.setNextGetItemGoal();

            } else if (this.mario.body?.blocked.right) {
                this.mario.jump("right");

            } else if (this.mario.body?.blocked.left) {
                this.mario.jump("left");

            } else {
                if (this.actionCounter > 50) {

                    // Walk to carrot  
                    if (this.mario.isWalking()) {
                        this.mario.idle(direction);
                        this.actionCounter = 0;

                    } else {
                        this.mario.walk(direction);
                        this.actionCounter = 0;
                    }
                }
            }

        } else if (this.mario.isHoldingEgg()) {
            // Main goal is to throw the egg on birdo
            const direction = this.whereIsBirdo();

            const wishedBirdoDiff = 24 + Math.floor(Math.random() * 48);

            // When mario is between 2 widths to 4 width away from birdo he can throw
            if (this.isCloseToBirdo(direction, wishedBirdoDiff)) {
                this.mario.throw(direction);
            } else if (this.mario.body?.blocked.right) {
                this.mario.jump("right")
            } else if (this.mario.body?.blocked.left) {
                this.mario.jump("left")
            } else {
                if (this.actionCounter > 50) {
                    // walk to carrot 
                    if (this.mario.isWalking()) {
                        this.mario.idle(direction);
                        this.actionCounter = 0;
                    } else {
                        this.mario.walk(direction);
                        this.actionCounter = 0;
                    }
                }
            }
        } else {

            // Main goal consists of: Pick up egg if standing on it, get a carrot to throw at birdo, get an egg to throw at birdo or to walk over to the other side of birdo. 

            if (this.mario.isStandingOnEgg()) {

                this.mario.startPickingEgg();
                this.actionCounter = 0;

            } else if (this.getItemGoal.goal === GetItemGoalType.PICK_CARROT) {

                if (!this.getItemGoal.targetCarrot) {
                    this.getItemGoal.targetCarrot = this.selectRandomTargetCarrot()!;
                }

                const direction = this.whichDirectionIs(this.getItemGoal.targetCarrot);

                if (this.isStandingAtGoalCarrot()) {
                    this.mario.startPickingCarrot();
                    this.actionCounter = 0;

                } else if (direction === "right" && this.mario.body?.blocked.right) {
                    this.mario.jump("right");

                } else if (direction === "left" && this.mario.body?.blocked.left) {
                    this.mario.jump("left");

                } else if (this.isCloseToBirdo(direction, 20)) {
                    this.mario.jump(direction, true);

                } else if (!this.mario.flipX && this.isCloseToEgg("right", 25) || this.mario.flipX && this.isCloseToEgg("left", 25)) {
                    this.mario.duck();
                } else if (this.mario.x + this.mario.width < 0) {
                    this.mario.walk("right");
                    this.actionCounter = 0;
                } else if (this.mario.x > WORLD_WIDTH) {
                    this.mario.walk("left");
                    this.actionCounter = 0;
                }
                else {
                    if (this.actionCounter > 50) {
                        // walk to carrot 
                        if (this.mario.isWalking()) {
                            this.mario.idle(direction);
                            this.actionCounter = 0;
                        } else {
                            this.mario.walk(direction);
                            this.actionCounter = 0;
                        }
                    }
                }
            }
            else if (this.getItemGoal.goal === GetItemGoalType.CATCH_EGG) {

                if (this.getItemGoal.birdoSide === "right") {

                    // Get mario to go to the left side and wait for egg

                    if (this.isCloseToEgg(this.getItemGoal.birdoSide)) {
                        this.mario.jump(this.getItemGoal.birdoSide, true);
                        this.actionCounter = 0;
                    } else if (this.mario.x > 8) {
                        this.mario.walk("left");
                        this.actionCounter = 0;
                    } else {
                        this.mario.idle(this.getItemGoal.birdoSide);
                    }

                } else {
                    // Get mario to go to the right side and wait for egg

                    if (this.isCloseToEgg(this.getItemGoal.birdoSide)) {
                        this.mario.jump(this.getItemGoal.birdoSide, true);
                        this.actionCounter = 0;
                    } else if (this.mario.x < WORLD_WIDTH - 32) {
                        this.mario.walk("right");
                        this.actionCounter = 0;
                    } else if (this.mario.x > WORLD_WIDTH) {
                        this.mario.walk("left");
                        this.actionCounter = 0;
                    } else {
                        this.mario.idle(this.getItemGoal.birdoSide);
                    }
                }
            }
        }
    }

    private isCloseToEgg(direction: "right" | "left", allowedDiff?: number): boolean {

        const egg: Egg | null = (this.mario.scene as Fighting).children.getAll().find(e => e instanceof Egg && e.state === EggState.FLYING) as Egg | null ?? null;

        if (!egg) return false;

        const diff = direction === "right" ? egg.x - (this.mario.x + this.mario.width) : this.mario.x - (egg.x + egg.width);

        return diff <= (allowedDiff ?? 200) && diff > 0;
    }

    private isCloseToBirdo(direction: "right" | "left", allowedDiff: number) {

        const birdo = (this.mario.scene as Fighting).birdo;

        const diff = direction === "right" ? birdo.x - (this.mario.x + this.mario.width) : this.mario.x - (birdo.x + birdo.width);

        return diff <= allowedDiff && diff > 0;
    }

    private whereIsBirdo() {
        const birdo = (this.mario.scene as Fighting).birdo;
        return this.mario.x < birdo.x ? "right" : "left";
    }

    private isStandingAtGoalCarrot() {

        if (this.getItemGoal.goal !== GetItemGoalType.PICK_CARROT) throw "No target carrot when goal is not to pick a carrot.";

        return this.mario.isStandingAt(this.getItemGoal.targetCarrot);
    }

    private selectRandomTargetCarrot(): Carrot | null {
        const carrots: Carrot[] = this.mario.scene.children.getAll().filter(o => o instanceof Carrot && o.state === CarrotState.GROUNDED) as Carrot[];

        return carrots[Math.floor(Math.random() * carrots.length)] ?? null;
    }

    private whichDirectionIs(obj: Phaser.Physics.Arcade.Sprite) {
        return this.mario.x < obj.x ? "right" : "left";
    }

    private setNextGetItemGoal() {
        const goal = Math.random() < 0.20 ? GetItemGoalType.CATCH_EGG : GetItemGoalType.PICK_CARROT;

        if (goal === GetItemGoalType.PICK_CARROT) {

            const carrot = this.selectRandomTargetCarrot();

            if (carrot !== null) {
                this.getItemGoal = { goal, targetCarrot: carrot };
            } else {
                this.getItemGoal = { goal: GetItemGoalType.CATCH_EGG, birdoSide: this.whereIsBirdo() };
            }

        } else {
            this.getItemGoal = { goal, birdoSide: this.whereIsBirdo() };
        }
    }

}