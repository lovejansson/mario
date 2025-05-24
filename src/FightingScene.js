import Scene from "./Scene.js";
import { StaticImage } from "./StaticImage.js";
import Carrot from "./Carrot.js";
import ArtObject from "./ArtObject.js";
import { getCollision } from "./collision.js";

/**
 * @typedef  {{obj: ArtObject, blocked: {
 * top: boolean,
 * right: boolean,
 * bottom: boolean,
 * left: boolean}}} CollisionResult
 */

export const FightingState = {
    INTRO: 0,
    FIGHTING: 1,
    MARIO_WON: 2,
    BIRDO_WON: 3,
};

const PLATFORM_BIG_HEIGHT = 32;
const PLATFORM_BIG_POS = { x: 0, y: WORLD_HEIGHT - PLATFORM_BIG_HEIGHT };

export const PLATFORM_BIRDO_WIDTH = 126;
export const PLATFORM_BIRDO_HEIGHT = 13;
export const PLATFORM_BIRDO_POS = { x: WORLD_WIDTH / 2 - PLATFORM_BIRDO_WIDTH / 2, y: PLATFORM_BIG_POS.y - PLATFORM_BIRDO_HEIGHT }


export default class FightingScene extends Scene {

    mario;
    birdo;
    #platformBig;
    #platformBig2; 
    #platformBig3;
    #platformBirdo;
    #backgroundImage;

    /**
     * @type {FightingState}
     */
    state;

    #palmtrees;
    #carrots;
    #eggs;


    constructor() {
        super("fighting");
        this.state = FightingState.INTRO;
    }

    init() {
        this.#createCarrots();
        this.#createPalmTrees();
        this.#eggs = [];
        this.#backgroundImage = new StaticImage({x: 0, y: 0}, this.art.width, this.art.height);
        this.mario = new Mario(this, 0, WORLD_HEIGHT - 32 - PLATFORM_BIG_HEIGHT, "mario-walk");
        this.birdo = new Birdo(this, PLATFORM_BIRDO_POS.x + PLATFORM_BIRDO_WIDTH - BIRDO_WIDTH, PLATFORM_BIRDO_POS.y - BIRDO_HEIGHT, "birdo-walk");

        this.#platformBirdo = new StaticImage(PLATFORM_BIRDO_POS.x, PLATFORM_BIRDO_POS.y, "birdo-platform");

        this.#platformBig = new StaticImage({x: PLATFORM_BIG_POS.x, y: PLATFORM_BIG_POS.y}, 320, 32, "platform-big");
        this.#platformBig2 = new StaticImage({x: -WORLD_WIDTH, y: PLATFORM_BIG_POS.y}, 320, 32, "platform-big");
        this.#platformBig3 = new StaticImage({x: +WORLD_WIDTH, y: PLATFORM_BIG_POS.y}, 320, 32, "platform-big");
        
    }

    update() {

        // Turn on/off background sound in fighting state

        if (this.state === FightingState.FIGHTING) {
            if(!this.art.services.audioPlayer.isPlaying("bg-fighting")) {
                this.art.services.audioPlayer.play("bg-fighting", true);
            }

        } else {
           if(this.art.services.audioPlayer.isPlaying("bg-fighting")) {
                this.art.services.audioPlayer.stop("bg-fighting");
            }
        }

        // Update the art objects in scene

        this.birdo.update(this.#getCollisions(this.birdo, [...this.#eggs, ...this.#carrots,this.#platformBig, this.#platformBig2, this.#platformBig3, this.#platformBirdo]));
        this.mario.update(this.#getCollisions(this.mario,  [...this.#eggs, ...this.#carrots, this.birdo, 
            this.#platformBig, this.#platformBig2, this.#platformBig3, this.#platformBirdo
        ]));


        for(const c of this.#carrots) {
            c.update(this.#getCollisions(c));
        }

        for(const e of this.#eggs) {
            e.update(this.#getCollisions(e, [this.mario, this.birdo]));
        }

        this.#eggs = this.#eggs.filter(e => {
            return !this.#isOutSideScene(e);
        });


        this.#carrots = this.#carrots.filter(c => {
            return !this.#isOutSideScene(c);
        })

    }

    draw(ctx) {

        this.#backgroundImage.draw(ctx); 
        this.#platformBig.draw(ctx);
        this.#platformBig2.draw(ctx); 
        this.#platformBig3.draw(ctx); 
        this.#platformBirdo.draw(ctx); 

        for (const c of this.#carrots) {
            c.draw(ctx);
        }

        for (const p of this.#palmtrees) {
            p.draw(ctx);
        }

        for(const e of this.#eggs) {
            e.draw(ctx);
        }

        this.birdo.draw();

        this.mario.draw();
    }


    addEgg(egg) {
        this.#eggs.push(egg);
    }

    #isOutSideScene(obj) {
        return obj.pos.x + obj.width < 0 || obj.pos.x > obj.art.width || obj.pos.y < 0 || obj.pos.y + obj.height > obj.art.height;
    }

    #createPalmTrees() {
        const PALMTREE_HEIGHT = 57;
        const y = WORLD_HEIGHT - PLATFORM_BIG_HEIGHT - PALMTREE_HEIGHT;

        this.#palmtrees.push(new StaticImage({x: 2, y}, 27, 57, "palmtree1"));
        this.#palmtrees.push(new StaticImage({x: 2 + 28, y}, 27, 57, "palmtree2"));
        this.#palmtrees.push(new StaticImage({x: 228, y}, 27, 57, "palmtree1"));
        this.#palmtrees.push(new StaticImage({x: 228 + 28, y}, 27, 57, "palmtree2"));
        this.#palmtrees.push(new StaticImage({x: 228 + 28 * 2, y}, 27, 57, "palmtree1"));
    }


    #createCarrots() {
        const y = PLATFORM_BIG_POS.y - 10;

        this.#carrots = [];

        for(const x of [52, 52 + 20, 246 + 24 * 2, 246, 246 + 24]) {
            this.#carrots.push(new Carrot(this, x, y, "carrot-ground"))
        }
    } 
    
    /**
     * Gets all collisions for a given art object.
     * @param {ArtObject} obj - The art object to check collisions for.
     * @returns {CollisionResult[]} An array of collisions.
     */
    #getCollisions(obj, otherObjs) {

        const collisions = [];

        for (let i = 0; i < otherObjs.length; ++i) {
            const otherObj = otherObjs[i];

            if (obj.id !== otherObj.id) {
                const collision = getCollision(obj, otherObj);

                if (collision) {
                    collisions.push(collision);
                }
            }
        }

        return collisions;
    }
}