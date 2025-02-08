import { Scene } from 'phaser';

export class MainMenu extends Scene {

    canvasClicked!: boolean;

    constructor() {
        super('MainMenu');
    }

    init() {
        console.log("INIT MAIN", this.canvasClicked)
        this.canvasClicked = false;
    }

    create() {
        console.log("CREATE MAIN", this.canvasClicked)
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        const canvas = document.querySelector("canvas");

        if (canvas === null) throw new Error("No canvas");

        canvas.addEventListener("click", () => {
            this.canvasClicked = true;
        });


    }

    update() {
        console.log("UPDATE MAIN", this.canvasClicked)
        if (this.canvasClicked) {
            console.log("STARTING FIGHTING", this.canvasClicked)
            this.scene.start('Fighting');
        }
    }
}