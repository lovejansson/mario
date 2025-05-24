/**
 * @typedef {import("./ArtObject.js").default} ArtObject
 */

/**
 * @typedef {import("./Scene.js").default} Scene
 */

export class StaticImage extends ArtObject {

    /**
     * Creates a new static image object.
     * @param {Scene} scene - The scene that the object is a part of.
     * @param {{ x: number, y: number }} pos - The position of the object.
     * @param {number} width - The width of the object.
     * @param {number} height - The height of the object.
     * @param {string} image - key of image.
     */
    constructor(scene, pos, width, height, image) {
        super(scene, pos, width, height);
        this.image = image;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.drawImage(this.scene.art.services.images.get(this.image), this.pos.x, this.pos.y, this.width, this.height);
    }

}