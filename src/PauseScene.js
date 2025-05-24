import Scene from "./Scene.js";

export default class PauseScene extends Scene {

    constructor() {
        super("pause");
    }

    update() {}

    /**
     * Draw the scene to the canvas
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.drawImage(this.artServices.images.get("thumbnail"));
    }
}