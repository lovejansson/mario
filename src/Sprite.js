import { AnimationManager } from "./AnimationManager.js";
import ArtObject from "./ArtObject.js";
import { NotImplementedError } from "./error.js";


export default class Sprite extends ArtObject {

     /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string | undefined} image 
     */
    constructor(scene, pos, width, height, image) {
        super(scene, pos, width, height);
        this.animations = new AnimationManager();
        this.image = image;
    }

    /**
     * 
     * @param {import("./collision.js").CollisionResult[]} collisions 
     */
    update(collisions) {
        throw new NotImplementedError("Sprite", "update");
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {

        // Draw static image for sprite
        if(this.image) {
            ctx.drawImage(this.scene.art.services.images.get(this.image), this.pos.x, this.pos.y);
        } else {
            // Draw animation for sprite
            this.animations.draw(ctx, this.pos);
        }

        throw new NotImplementedError("Sprite", "draw");
    }
}


