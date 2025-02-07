import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        const canvas = document.querySelector("canvas");

        canvas?.addEventListener("click", () => {
            this.scene.start('Fighting');
        });
    }
}