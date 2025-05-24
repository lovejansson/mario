/**
 * @typedef {import("./Art.js").default} Art
 * import
 */


import { NotImplementedError} from "./error.js";

export default class Scene {

    #name;

    /**
    * @type {Art}
    */
    art;

    /**
     * @param {string} name 
     */
    constructor(name){
        this.#name = name;
    }

    update() {
        throw new NotImplementedError("Scene", "update");
    }


    draw(ctx) {
        throw new NotImplementedError("Scene", "draw");
    }

}