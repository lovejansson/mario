import AssetHandler from "./AssetHandler";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState } from "./types";

export class Egg implements GameObject {

    pos: Point;
    vel: Point;
    kind: GameObjectKind = GameObjectKind.EGG;

    private isPickedUp: boolean;
    private isThrowed: boolean;
    private frame: number;

    constructor(x: number, y: number) {
        this.vel = { x: 0, y: 0 };
        this.pos = { x, y };
        this.isPickedUp = false;
        this.isThrowed = false;
        this.frame = 0;
    }

    init() {

    }

    getCollisionBox(): CollisionBox {
        return { y1: this.pos.y, x1: this.pos.x, x2: this.pos.x + 12, y2: this.pos.y + 16 }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const assetHandler = AssetHandler.getInstance();
        ctx.drawImage(assetHandler.get("egg"), this.pos.x, this.pos.y);


    }

    // Connects this egg to a certain position. Used for when mario is holding the egg
    pickUp() {
        this.isPickedUp = true;
    }

    // Starts a throw of the egg from current position at 
    throw(dir: "right" | "left") {
        this.isThrowed = true;
        this.vel.x = dir === "right" ? 8 : -8;
        this.frame = 0;
    }

    update(_: number, __: KeyState, ___: Collision[]) {

        if (this.isThrowed) {
            if (this.frame % 2 === 0) {
                const g = 0.25;
                const vi = -1;
                // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
                this.vel.y = vi + (g * this.frame);
            }
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
            this.frame++;

        } else if (!this.isPickedUp) {
            this.vel.x = -1;
            this.vel.y = 0;

            if (this.pos.x < -16) {
                return true;
            } else {
                this.pos.x += this.vel.x;
            }
        }

    }
}   