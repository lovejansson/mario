import AssetHandler from "./AssetHandler";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState } from "./types";

export class Egg implements GameObject {

    pos: Point;
    vel: Point;
    kind: GameObjectKind = GameObjectKind.EGG;

    private isPickedUp: boolean;

    constructor(x: number, y: number) {
        this.vel = { x: 0, y: 0 };
        this.pos = { x, y };
        this.isPickedUp = false;
    }

    init() {

    }

    getCollisionBox(): CollisionBox {
        return { y1: this.pos.y, x1: this.pos.x, x2: this.pos.x + 18, y2: this.pos.y + 16 }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const assetHandler = AssetHandler.getInstance();
        ctx.drawImage(assetHandler.get("egg"), this.pos.x, this.pos.y);
    }

    // Connects this egg to a certain position. Used for when mario is holding the egg
    connect() {

        this.isPickedUp = true;
    }

    // Starts a throw of the egg from current position at 
    throw(dir: "right" | "left") {

    }

    update(_: number, __: KeyState, ___: Collision[]) {

        if (!this.isPickedUp) {
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