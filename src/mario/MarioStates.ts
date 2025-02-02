import { Carrot } from "../Carrot";
import { Egg } from "../Egg";
import { Mario } from "./Mario";


export interface MarioStateUpdate {
    update(mario: Mario): void;
}


export class MarioIdle implements MarioStateUpdate {
    private direction: "right" | "left" | undefined;

    constructor(direction?: "right" | "left") {

        this.direction = direction;
    }

    update(mario: Mario) {

        if (this.direction) mario.setFlipX(this.direction === "left");

        if (mario.isHoldingEgg() || mario.isHoldingCarrot()) {
            if (mario.isHurting) {
                mario.play('idle-holding-hurting', true);
            } else {
                mario.play('idle-holding', true);
            }
            mario.adjustHeight(48);
        } else if (mario.isHurting) {
            mario.play('idle-hurting', true);
            mario.adjustHeight(32);
        } else {
            mario.play('idle', true);
            mario.adjustHeight(32);
        }

        mario.setVelocityX(0);
        mario.setGravity(0);
    }
}


export class MarioWalking implements MarioStateUpdate {
    private direction: "right" | "left" | undefined;

    constructor(direction?: "right" | "left") {
        this.direction = direction;
    }

    update(mario: Mario) {

        if (this.direction) mario.setFlipX(this.direction === "left");

        mario.setVelocityX(this.direction === "right" ? 60 : -60);

        if (mario.isHoldingEgg() || mario.isHoldingCarrot()) {
            if (mario.isHurting) {
                mario.play("walk-holding-hurting", true);
            } else {
                mario.play('walk-holding', true);
            }

            mario.adjustHeight(48);
        }
        else if (mario.isHurting) {
            mario.play("walk-hurting", true);
            mario.adjustHeight(32);
        } else {
            mario.play('walk', true);
            mario.adjustHeight(32);
        }

    }
}


export class MarioJumping implements MarioStateUpdate {
    private direction: "right" | "left" | undefined;
    private bigJump: boolean | undefined;
    private hasJumped: boolean;

    constructor(direction?: "right" | "left", bigJump?: boolean) {
        this.direction = direction;
        this.bigJump = bigJump;
        this.hasJumped = false;
    }

    update(mario: Mario): void {

        // Check if mario has returned to the ground.
        if (this.hasJumped) {
            if (mario.dynamicBody.blocked.down) {
                mario.marioMovement = new MarioIdle(this.direction);
            }
        }

        // Initially set y velocity.
        if (!this.hasJumped) {
            // Set velocity upwards and possibly at direction to start jumping.
            mario.setVelocityY(this.bigJump ? -900 : -600);
            this.hasJumped = true;
            // Play jump sound.
            mario.playSound("mario-jump");
        }

        // Put mario in the correct direction and set x velocity
        if (this.direction) {
            mario.setFlipX(this.direction === "right" ? false : true);
            mario.setVelocityX(this.direction === "right" ? (this.bigJump ? 160 : 60) : (this.bigJump ? -160 : -60));
        } else {
            mario.setVelocityX(0);
        }

        // Set gravity so that he comes back down again. 
        mario.setGravityY(2000);

        // Pick correct sprite animation.
        if (mario.isHoldingEgg() || mario.isHoldingCarrot()) {
            if (mario.isHurting) {
                mario.play("jump-holding-hurting", true);

            } else {
                mario.play('jump-holding', true);
            }

            mario.adjustHeight(48);

        } else if (mario.isHurting) {
            mario.play("jump-hurting", true);
            mario.adjustHeight(32);
        } else {
            mario.play('jump', true);
            mario.adjustHeight(32);
        }

    }
}


export class MarioDucking implements MarioStateUpdate {

    update(mario: Mario) {
        mario.play("duck", true);
        mario.adjustHeight(24);
        mario.setVelocityX(0);
    }
}

export enum ItemType {
    CARROT,
    EGG
}

type Item = {
    type: ItemType.CARROT,
    item: Carrot;
} | {
    type: ItemType.EGG,
    item: Egg;
}


export class MarioPickingItem implements MarioStateUpdate {
    private item: Item;
    private hasStarted: boolean;
    private counter: number;

    constructor(item: Item) {
        this.item = item;
        this.hasStarted = false;
        this.counter = 0;
    }

    public isPickingEgg() {
        return this.item.type === ItemType.EGG;
    }

    public isPickingCarrot() {
        return this.item.type === ItemType.CARROT;
    }

    public isPickingThis(obj: Carrot | Egg) {
        return this.item.item === obj;
    }

    update(mario: Mario): void {
        if (!this.hasStarted) {
            mario.playSound("mario-picking");
            this.hasStarted = true;
        } else if (this.counter > 25) {

            if (this.item.type === ItemType.CARROT) {
                this.item.item.pickUp();
                mario.holdCarrot(this.item.item);
            } else {
                this.item.item.pickUp();
                mario.holdEgg(this.item.item);
            }

            mario.playSound("mario-picked");
            mario.marioMovement = new MarioIdle(mario.flipX ? "left" : "right");
        }

        if (this.item.type === ItemType.EGG) {
            mario.setVelocityX((this.item.item.dynamicBody.velocity.x));
        }

        if (mario.isHurting) {
            mario.play("pick-hurting", true);
        } else {
            mario.play("pick", true);
        }

        mario.adjustHeight(24);
        mario.setVelocityX(0);

        this.counter++;
    }
}


export class MarioThrowingItem implements MarioStateUpdate {
    private hasThrowed: boolean;
    private counter: number;


    constructor() {
        this.hasThrowed = false;
        this.counter = 0;
    }

    update(mario: Mario): void {

        if (!this.hasThrowed) {
            mario.playSound("mario-throw");
            this.hasThrowed = true;
        } else if (this.counter > 20) {
            mario.marioMovement = new MarioIdle(mario.flipX ? "left" : "right");
        }

        mario.play('throw', true);
        mario.adjustHeight(48);
        mario.setVelocityX(0);
        this.counter++;
    }
}


export class MarioHoldingItem implements MarioStateUpdate {
    item: Item | null;

    constructor(item: Item | null) {
        this.item = item;
    }

    public isHoldingEgg() {
        return this.isHoldingItem() && this.item!.type === ItemType.EGG;
    }

    public isHoldingCarrot() {
        return this.isHoldingItem() && this.item!.type === ItemType.CARROT;
    }

    public isHoldingItem() {
        return this.item !== null;
    }

    public isHoldingThis(obj: Carrot | Egg) {
        return this.isHoldingItem() && this.item!.item === obj;
    }

    public holdItem(item: Item) {
        this.item = item;

    }

    throw(direction: "right" | "left") {
        if (!this.isHoldingItem()) throw new Error("Mario can't throw item bc he is not holding one.");
        this.item!.item.throw(direction);
        this.item = null;
    }

    drop(direction: "right" | "left") {
        if (!this.isHoldingItem()) throw new Error("Mario can't drop item bc he is not holding one.");
        this.item!.item.drop(direction);
        this.item = null;
    }

    update(mario: Mario): void {
        if (!this.isHoldingItem()) throw new Error("Mario is not holding item right now.");

        if (this.item!.type === ItemType.CARROT) {
            // Update carrots's position according to Mario's position!
            this.item!.item.flipX = mario.flipX;
            // It is better to update the body's position than the sprite's position since the sprite's position is synced with the body's position during the game loop. If the sprite's position would be updated directly it might not align properly with the body. 
            this.item!.item.dynamicBody.position.set(mario.x + mario.width / 2 - this.item!.item.dynamicBody.halfWidth, mario.y - 4);
        } else {
            // Update egg's position according to Mario's position
            this.item!.item.flipX = !mario.flipX;
            // It is better to update the body's position than the sprite's position since the sprite's position is synced with the body's position during the game loop. If the sprite's position would be updated directly it might not align properly with the body. 
            this.item!.item.dynamicBody.position.set(mario.x + mario.width / 2 - this.item!.item.dynamicBody.halfWidth, mario.y - 2);
        }
    }
}


export class MarioStandingOnEgg implements MarioStateUpdate {
    egg: Egg | null;

    constructor(egg: Egg | null) {
        this.egg = egg;

    }

    standOn(egg: Egg): void {
        this.egg = egg;
        egg.standOn();
    }

    isStandingOnEgg(): boolean {
        return this.egg !== null;
    }

    update(mario: Mario): void {

        if (!this.isStandingOnEgg()) throw "Mario isn't standing on an egg right now."

        // Not standing on the egg anymore.
        if (!mario.dynamicBody.blocked.down) {
            this.egg = null;
            // Update mario's velocity x according to the egg's.
        } else {
            mario.setVelocityX(mario.dynamicBody.velocity.x + this.egg!.dynamicBody.velocity.x);
        }

    }
}


export class MarioStandingAtCarrot implements MarioStateUpdate {
    carrot: Carrot | null;

    constructor(carrot: Carrot | null) {
        this.carrot = carrot;
    }

    standAt(carrot: Carrot): void {
        this.carrot = carrot;
    }

    leftCarrot(): void {
        this.carrot = null;
    }

    isStandingAtCarrot(): boolean {
        return this.carrot !== null;
    }

    isStandingAt(carrot: Carrot): boolean {
        return this.carrot === carrot;
    }

    update(mario: Mario): void {

        if (!this.isStandingAtCarrot()) throw "Mario isn't standing on an carrot right now.";

        const overlapX = Math.min(this.carrot!.x + this.carrot!.width, mario.x + mario.width) - Math.max(this.carrot!.x, mario.x);

        if (overlapX < this.carrot!.width * 0.75) {
            this.carrot = null;
        }
    }
}