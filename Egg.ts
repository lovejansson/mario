import AssetHandler from "./AssetHandler";
import { Mario } from "./Mario";
import { GameObject, Collision, CollisionBox, GameObjectKind, Point, KeyState } from "./types";


export enum EggState {
    FLYING = "flying",
    PICKED_UP = "picked-up",
    THROWED = "throwed",
    COLLIDED = "collided"
}
export class Egg implements GameObject {

    id: string;
    pos: Point;
    vel: Point;
    kind: GameObjectKind = GameObjectKind.EGG;

    private frame: number;
    state: EggState;

    constructor(x: number, y: number) {
        this.vel = { x: 0, y: 0 };
        this.pos = { x, y };

        this.frame = 0;
        this.id = "egg" + Date.now().toString();
        this.state = EggState.FLYING;
    }

    init() {

    }

    getCollisionBox(): CollisionBox {
        return { y: this.pos.y, x: this.pos.x, h: 16, w: 19 }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const assetHandler = AssetHandler.getInstance();
        ctx.drawImage(assetHandler.get("egg"), this.pos.x, this.pos.y);

    }

    // Connects this egg to a certain position. Used for when mario is holding the egg
    pickUp() {
        this.state = EggState.PICKED_UP;
    }

    // Starts a throw of the egg from current position at 
    throw(dir: "right" | "left") {

        this.state = EggState.THROWED;
        this.vel.x = dir === "right" ? 8 : -8;
        this.frame = 0;
    }

    update(_: number, __: KeyState, collisions: Collision[]) {
        switch (this.state) {
            case EggState.FLYING:
                {

                    const marioCollision = collisions.find(c => c.obj instanceof Mario);

                    if (marioCollision !== undefined && ["west", "east"].includes(marioCollision.collisionPoint)) {
                        this.state = EggState.COLLIDED;
                        this.vel.x = marioCollision.collisionPoint === "east" ? -2 : 2;
                        this.frame = 0;
                        break;
                    }

                    this.vel.x = -1;
                    this.vel.y = 0;

                    if (this.pos.x < -16) {
                        return true;
                    } else {
                        this.pos.x += this.vel.x;
                    }

                }
                break;
            case EggState.PICKED_UP:
                // no updates, is controlled by other object.
                break;
            case EggState.THROWED:
                {
                    const dragonCollision = collisions.find(c => c.obj.id === "dragon");

                    if (dragonCollision !== undefined) {

                        this.state = EggState.COLLIDED;
                        this.vel.x = dragonCollision.collisionPoint === "east" ? -2 : 2;
                        this.frame = 0;
                        break;
                    }

                    const g = 0.25;
                    const vi = -1;

                    // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
                    this.vel.y = vi + (g * this.frame);

                    this.pos.x += this.vel.x;
                    this.pos.y += this.vel.y;
                    this.frame++;

                }
                break;
            case EggState.COLLIDED:
                {
                    if (this.pos.y > 180 || this.pos.x > 320) return true; // Deletes this egg out of world
                    const g = 0.25;
                    const vi = -1;

                    // Calculates the velocity vf = vi + at where vi is the initial jump velocity above and a is the gravity that pulls mario 1 pixel downwards. t is the number of frames. 
                    this.vel.y = vi + (g * this.frame);

                    this.pos.x += this.vel.x;
                    this.pos.y += this.vel.y;
                    this.frame++;

                }
                break;
        }

    }
}   