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
        this.load.audio("bg-fighting", "/assets/audio/boss-fighting.ogg");
        this.load.audio("mario-won", "/assets/audio/mario-won.ogg");
        this.load.audio("birdo-won", "/assets/audio/mario-died.ogg");

        this.load.image("heart", "/assets/images/heart.png");
        this.load.image("background", "/assets/images/background.png");
        this.load.image("egg", "/assets/images/egg.png");
        this.load.image("platform", "/assets/images/platform.png");
        this.load.image("platform-big", "/assets/images/platform-big.png");

        this.load.image("carrot-orange", "/assets/images/carrot-orange.png");
        this.load.image("carrot-white", "/assets/images/carrot-white.png");
        this.load.image("carrot-grounded", "/assets/images/carrot-ground.png");
        this.load.image("palmtree1", "/assets/images/palmtree1.png");
        this.load.image("palmtree2", "/assets/images/palmtree2.png");

        // Mario images
        this.load.spritesheet('mario-walk', 'assets/images/mario-walk.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.load.spritesheet('mario-walk-hurting', 'assets/images/mario-walk-hurting.png', {
            frameWidth: 32,
            frameHeight: 32,
        });


        this.load.spritesheet('mario-walk-holding', 'assets/images/mario-walk-holding.png', {
            frameWidth: 32,
            frameHeight: 48,
        });

        this.load.spritesheet('mario-walk-holding-hurting', 'assets/images/mario-walk-holding-hurting.png', {
            frameWidth: 32,
            frameHeight: 48,
        });

        this.load.image("mario-pick", "/assets/images/mario-pick.png");
        this.load.image("mario-pick-hurting", "/assets/images/mario-pick-hurting.png");
        this.load.image("mario-duck", "/assets/images/mario-duck.png");
        this.load.image("mario-throw", "/assets/images/mario-throw.png");
        this.load.image("mario-win", "/assets/images/mario-win.png");
        this.load.image("mario-dead", "/assets/images/mario-dead.png");


        // Mario Sounds
        this.load.audio("mario-throw", "/assets/audio/mario-throw.ogg");
        this.load.audio("mario-picking", "/assets/audio/mario-picking.ogg");
        this.load.audio("mario-picked", "/assets/audio/mario-picked.ogg");
        this.load.audio("mario-ouch", "/assets/audio/mario-ouch.ogg");
        this.load.audio("mario-jump", "/assets/audio/mario-jump.ogg");


        // Birdo images

        this.load.spritesheet('birdo-walk', 'assets/images/birdo-walk.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-shoot', 'assets/images/birdo-shoot.png', {
            frameWidth: 27,
            frameHeight: 46,
        });
        this.load.spritesheet('birdo-idle', 'assets/images/birdo-idle.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-walk-hurting', 'assets/images/birdo-walk-hurting.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.spritesheet('birdo-shoot-hurting', 'assets/images/birdo-shoot-hurting.png', {
            frameWidth: 27,
            frameHeight: 46,
        });
        this.load.spritesheet('birdo-idle-hurting', 'assets/images/birdo-idle-hurting.png', {
            frameWidth: 27,
            frameHeight: 46,
        });

        this.load.image("birdo-platform", "/assets/images/birdo-platform.png")

        // Birdo sounds

        this.load.audio("birdo-shoot-egg", "/assets/audio/birdo-shoot-egg.ogg");
        this.load.audio("birdo-hurting", "/assets/audio/birdo-hurt.ogg");
        this.load.audio("birdo-intro", "/assets/audio/birdo-intro.ogg");

    }


    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}