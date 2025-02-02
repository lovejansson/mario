import { Display, Scene } from 'phaser';

/**
 * Boot scene is used for loading assets needed for the Preloader Scene. 
 * The smaller the file sizes here, the better. 
 */
export class Boot extends Scene {

    constructor() {
        super('Boot');
    }

    init() {
        this.add.rectangle(0, 0, 320, 180, Display.Color.GetColor(255, 255, 255), 1)
    }

    preload() {
        this.load.image("start-screen", "/images/start-screen.png");
    }

    create() {
        this.scene.start('Preloader');
    }
}