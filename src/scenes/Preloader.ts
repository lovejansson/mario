import { Scene } from 'phaser';

const baseUrl = import.meta.env.BASE_URL;

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }


    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        const background = this.add.image(0, 0, 'start-screen');
        background.setOrigin(0, 0);
    }


    preload() {

        //  Load all the assets 

        // General 
        this.load.audio("bg-fighting", `${baseUrl}audio/boss-fighting.ogg`);
        this.load.audio("mario-won", `${baseUrl}audio/mario-won.ogg`);
        this.load.audio("birdo-won", `${baseUrl}audio/mario-died.ogg`);

        this.load.image("heart", `${baseUrl}images/heart.png`);
        this.load.image("background", `${baseUrl}images/background.png`);
        this.load.image("egg", `${baseUrl}images/egg.png`);
        this.load.image("platform", `${baseUrl}images/platform.png`);
        this.load.image("platform-big", `${baseUrl}images/platform-big.png`);

        this.load.image("carrot-orange", `${baseUrl}images/carrot-orange.png`);
        this.load.image("carrot-white", `${baseUrl}images/carrot-white.png`);
        this.load.image("carrot-grounded", `${baseUrl}images/carrot-ground.png`);
        this.load.image("palmtree1", `${baseUrl}images/palmtree1.png`);
        this.load.image("palmtree2", `${baseUrl}images/palmtree2.png`);

        // Mario images
        this.load.spritesheet('mario-walk', `${baseUrl}images/mario-walk.png`, {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.load.spritesheet('mario-walk-hurting', `${baseUrl}images/mario-walk-hurting.png`, {
            frameWidth: 32,
            frameHeight: 32,
        });


        this.load.spritesheet('mario-walk-holding', `${baseUrl}images/mario-walk-holding.png`, {
            frameWidth: 32,
            frameHeight: 48,
        });

        this.load.spritesheet('mario-walk-holding-hurting', `${baseUrl}images/mario-walk-holding-hurting.png`, {
            frameWidth: 32,
            frameHeight: 48,
        });

        this.load.image("mario-pick", `${baseUrl}images/mario-pick.png`);
        this.load.image("mario-pick-hurting", `${baseUrl}images/mario-pick-hurting.png`);
        this.load.image("mario-duck", `${baseUrl}images/mario-duck.png`);
        this.load.image("mario-throw", `${baseUrl}images/mario-throw.png`);
        this.load.image("mario-win", `${baseUrl}images/mario-win.png`);
        this.load.image("mario-dead", `${baseUrl}images/mario-dead.png`);


        // Mario Sounds
        this.load.audio("mario-throw", `${baseUrl}audio/mario-throw.ogg`);
        this.load.audio("mario-picking", `${baseUrl}audio/mario-picking.ogg`);
        this.load.audio("mario-picked", `${baseUrl}audio/mario-picked.ogg`);
        this.load.audio("mario-ouch", `${baseUrl}audio/mario-ouch.ogg`);
        this.load.audio("mario-jump", `${baseUrl}audio/mario-jump.ogg`);


        // Birdo images

        this.load.spritesheet('birdo-walk', `${baseUrl}images/birdo-walk.png`, {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-shoot', `${baseUrl}images/birdo-shoot.png`, {
            frameWidth: 27,
            frameHeight: 46,
        });
        this.load.spritesheet('birdo-idle', `${baseUrl}images/birdo-idle.png`, {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-walk-hurting', `${baseUrl}images/birdo-walk-hurting.png`, {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-shoot-hurting', `${baseUrl}images/birdo-shoot-hurting.png`, {
            frameWidth: 27,
            frameHeight: 46,
        });
        this.load.spritesheet('birdo-idle-hurting', `${baseUrl}images/birdo-idle-hurting.png`, {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.image("birdo-platform", `${baseUrl}images/birdo-platform.png`)

        // Birdo sounds

        this.load.audio("birdo-shoot-egg", `${baseUrl}audio/birdo-shoot-egg.ogg`);
        this.load.audio("birdo-hurting", `${baseUrl}audio/birdo-hurt.ogg`);
        this.load.audio("birdo-intro", `${baseUrl}audio/birdo-intro.ogg`);

    }


    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}