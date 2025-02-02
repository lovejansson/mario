import { Scene } from 'phaser';

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
        this.load.audio("bg-fighting", "/audio/boss-fighting.ogg");
        this.load.audio("mario-won", "/audio/mario-won.ogg");
        this.load.audio("birdo-won", "/audio/mario-died.ogg");

        this.load.image("heart", "/images/heart.png");
        this.load.image("background", "/images/background.png");
        this.load.image("egg", "/images/egg.png");
        this.load.image("platform", "/images/platform.png");
        this.load.image("platform-big", "/images/platform-big.png");

        this.load.image("carrot-orange", "/images/carrot-orange.png");
        this.load.image("carrot-white", "/images/carrot-white.png");
        this.load.image("carrot-grounded", "/images/carrot-ground.png");
        this.load.image("palmtree1", "/images/palmtree1.png");
        this.load.image("palmtree2", "/images/palmtree2.png");

        // Mario images
        this.load.spritesheet('mario-walk', '/images/mario-walk.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.load.spritesheet('mario-walk-hurting', '/images/mario-walk-hurting.png', {
            frameWidth: 32,
            frameHeight: 32,
        });


        this.load.spritesheet('mario-walk-holding', '/images/mario-walk-holding.png', {
            frameWidth: 32,
            frameHeight: 48,
        });

        this.load.spritesheet('mario-walk-holding-hurting', '/images/mario-walk-holding-hurting.png', {
            frameWidth: 32,
            frameHeight: 48,
        });

        this.load.image("mario-pick", "/images/mario-pick.png");
        this.load.image("mario-pick-hurting", "/images/mario-pick-hurting.png");
        this.load.image("mario-duck", "/images/mario-duck.png");
        this.load.image("mario-throw", "/images/mario-throw.png");
        this.load.image("mario-win", "/images/mario-win.png");
        this.load.image("mario-dead", "/images/mario-dead.png");


        // Mario Sounds
        this.load.audio("mario-throw", "/audio/mario-throw.ogg");
        this.load.audio("mario-picking", "/audio/mario-picking.ogg");
        this.load.audio("mario-picked", "/audio/mario-picked.ogg");
        this.load.audio("mario-ouch", "/audio/mario-ouch.ogg");
        this.load.audio("mario-jump", "/audio/mario-jump.ogg");


        // Birdo images

        this.load.spritesheet('birdo-walk', '/images/birdo-walk.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-shoot', '/images/birdo-shoot.png', {
            frameWidth: 27,
            frameHeight: 46,
        });
        this.load.spritesheet('birdo-idle', '/images/birdo-idle.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-walk-hurting', '/images/birdo-walk-hurting.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-shoot-hurting', '/images/birdo-shoot-hurting.png', {
            frameWidth: 27,
            frameHeight: 46,
        });
        this.load.spritesheet('birdo-idle-hurting', '/images/birdo-idle-hurting.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.image("birdo-platform", "/images/birdo-platform.png")

        // Birdo sounds

        this.load.audio("birdo-shoot-egg", "/audio/birdo-shoot-egg.ogg");
        this.load.audio("birdo-hurting", "/audio/birdo-hurt.ogg");
        this.load.audio("birdo-intro", "/audio/birdo-intro.ogg");

    }


    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}