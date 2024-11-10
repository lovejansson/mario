
import AssetManager from "./AssetManager";
import { Collision, GameObject, Point } from "./types";

export class Platform implements GameObject {
    id: string;
    pos: Point;
    vel: Point;

    constructor() {
        this.pos = { x: Math.floor(320 / 2 - 85 / 2), y: 50 };
        this.vel = { x: 0, y: 0 };
        this.id = "platform";
    }

    getCollisionBox() {
        return { y: this.pos.y - 1, x: this.pos.x, h: 30, w: 85 }
    }


    init() {
        const assetHandler = AssetManager.getInstance();
        assetHandler.register("platform", "./assets/images/platform.png");
    }


    draw(ctx: CanvasRenderingContext2D) {
        const platformImage = AssetManager.getInstance().get("platform");
        ctx.drawImage(platformImage, this.pos.x, this.pos.y);
    }


    update(elapsedMillis: number, collisions: Collision[]) {
        // Unnessecary
    }

}