
import { NotImplementedError } from "./error.js";
/** 
* @typedef {import("./Scene.js").default} Scene
*/

export default class ArtObject {
    /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     */
    constructor(scene, pos, width, height) {
        this.scene = scene;
        this.pos = pos;
        this.width = width;
        this.height = height;
    }

    draw() {
        throw new NotImplementedError("ArtObject", "draw");
    }
}