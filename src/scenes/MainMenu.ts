import { Scene } from 'phaser';

export class MainMenu extends Scene {

    canvasClicked!: boolean;

    constructor() {
        super('MainMenu');
    }

    create() {
        this.canvasClicked = false;
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        const canvas = document.querySelector("canvas");

        if (canvas === null) throw new Error("No canvas");

        canvas.addEventListener("click", () => {
            this.canvasClicked = true;
        });


    }

    update() {
        if (this.canvasClicked) {
            this.scene.start('Fighting');
        }
    }
}