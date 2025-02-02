import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        this.input.once('pointerdown', () => {
            this.scene.start('Fighting');
        });
    }
}