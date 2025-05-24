import AudioPlayer from "./AudioPlayer.js";
import ImagesManager from "./ImagesManager.js";
import {BASE_URL} from "./config.js";

/**
 * @typedef ArtConfig
 * @property {number} width
 * @property {number} height
 * @property {typeof Scene} play
 * @property {typeof Scene} pause
 * @property {string | undefined} assetsPath
 */


export default class Art  {

    /**
     * @type {Scene} 
     */
    #pause;

    /**
     * @type {Scene} 
     */
    #play;

    /**
     * @type {boolean}
     */
    #isPlaying;

    /**
     * @type {number}
     */
    width;

    /**
     * @type {number}
     */
    height;

    /**
     * @type {{images: ImagesManager, audioPlayer: AudioPlayer}}
     */
    services;

    /**
     * @param {ArtConfig} config 
     */
    constructor(config) {

        this.services = {
            images: new ImagesManager(),
            audioPlayer: new AudioPlayer(),
        };

        this.#isPlaying = false;

        this.#pause = config.pause;
        this.#play = config.play;
        this.width = config.width;
        this.height = config.height;
        this.#pause.art = this;
        this.#play.art = this;

    }

    play() {
        this.#init().then(ctx => {
            this.#privatePlay(ctx);
        }).catch(_ => { throw new Error("Art failed to play: initialization error"); });
    }

    #privatePlay(ctx) {

        if(this.#isPlaying) {
            ctx.clearReact(0, 0, this.width, this.height);
            this.#play.update();
            this.#play.draw(ctx);
        } else {
            this.#pause.update();
            this.#pause.draw(ctx);
        }

        requestAnimationFrame(() => this.#privatePlay(ctx));
    }

    async #init() {

        const canvas = document.querySelector("canvas");

        if(canvas === null) {
            console.error("canvas is null");
            throw new Error("canvas is null");
        }

        canvas.width = this.width;
        canvas.height = this.height;

        const ctx = canvas.getContext("2d");

        if(ctx === null) {
            console.error("ctx is null");
            throw new Error("ctx is null");
        }

        ctx.imageSmoothingEnabled = true;

        await this.#loadAssets();

        canvas.addEventListener("click", () => {
            this.#isPlaying = !this.#isPlaying;
        });

        return ctx;
    }

    async #loadAssets() {

        this.services.imagesManager.add("heart", `${BASE_URL}images/heart.png`);
        this.services.imagesManager.add("background", `${BASE_URL}images/background.png`);
        this.services.imagesManager.add("egg", `${BASE_URL}images/egg.png`);
        this.services.imagesManager.add("platform", `${BASE_URL}images/platform.png`);
        this.services.imagesManager.add("platform-big", `${BASE_URL}images/platform-big.png`);
        this.services.imagesManager.add("thumbnail", `${BASE_URL}images/thumbnail.png`);

        this.services.imagesManager.add("carrot-orange", `${BASE_URL}images/carrot-orange.png`);
        this.services.imagesManager.add("carrot-white", `${BASE_URL}images/carrot-white.png`);
        this.services.imagesManager.add("carrot-grounded", `${BASE_URL}images/carrot-ground.png`);
        this.services.imagesManager.add("palmtree1", `${BASE_URL}images/palmtree1.png`);
        this.services.imagesManager.add("palmtree2", `${BASE_URL}images/palmtree2.png`);

        this.services.imagesManager.add("mario-pick", `${BASE_URL}images/mario-pick.png`);
        this.services.imagesManager.add("mario-pick-hurting", `${BASE_URL}images/mario-pick-hurting.png`);
        this.services.imagesManager.add("mario-duck", `${BASE_URL}images/mario-duck.png`);
        this.services.imagesManager.add("mario-throw", `${BASE_URL}images/mario-throw.png`);
        this.services.imagesManager.add("mario-win", `${BASE_URL}images/mario-win.png`);
        this.services.imagesManager.add("mario-dead", `${BASE_URL}images/mario-dead.png`);
        this.services.imagesManager.add("birdo-platform", `${BASE_URL}images/birdo-platform.png`);

        this.services.imagesManager.add("mario-walk", `${BASE_URL}images/mario-walk.png`); // 32,32
        this.services.imagesManager.add("mario-walk-hurting", `${BASE_URL}images/mario-walk-hurting.png`); // 32 32
        this.services.imagesManager.add("mario-walk-holding", `${BASE_URL}images/mario-walk-holding.png`); // 32 48
        this.services.imagesManager.add("mario-walk-holding-hurting", `${BASE_URL}images/mario-walk-holding-hurting.png`); // 32 48
        this.services.imagesManager.add("birdo-walk", `${BASE_URL}images/birdo-walk.png`); // 27 46
        this.services.imagesManager.add("birdo-shoot", `${BASE_URL}images/birdo-shoot.png`); // 27 46
        this.services.imagesManager.add("birdo-idle", `${BASE_URL}images/birdo-idle.png`); // 27 46
        this.services.imagesManager.add("birdo-walk-hurting", `${BASE_URL}images/birdo-walk-hurting.png`);// 27 46
        this.services.imagesManager.add("birdo-shoot-hurting", `${BASE_URL}images/birdo-shoot-hurting.png`);// 27 46
        this.services.imagesManager.add("birdo-idle-hurting", `${BASE_URL}images/birdo-idle-hurting.png`);// 27 46

        this.services.audioPlayer.add("mario-throw", `${BASE_URL}audio/mario-throw.ogg`);
        this.services.audioPlayer.add("mario-picking", `${BASE_URL}audio/mario-picking.ogg`);
        this.services.audioPlayer.add("mario-picked", `${BASE_URL}audio/mario-picked.ogg`);
        this.services.audioPlayer.add("mario-ouch", `${BASE_URL}audio/mario-ouch.ogg`);
        this.services.audioPlayer.add("mario-jump", `${BASE_URL}audio/mario-jump.ogg`);
        this.services.audioPlayer.add("birdo-shoot-egg", `${BASE_URL}audio/birdo-shoot-egg.ogg`);
        this.services.audioPlayer.add("birdo-hurting", `${BASE_URL}audio/birdo-hurt.ogg`);
        this.services.audioPlayer.add("birdo-intro", `${BASE_URL}audio/birdo-intro.ogg`);

        await this.services.imagesManager.load();
        await this.services.audioPlayer.load();
    }
}