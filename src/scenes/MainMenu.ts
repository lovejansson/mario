import { Scene } from 'phaser';

export class MainMenu extends Scene {

    canvasClicked!: boolean;

    private canvasClickListener: () => void;


    constructor() {
        super('MainMenu');
        this.canvasClickListener = () => {
            this.canvasClicked = true;
        };
    }

    init() {
        this.canvasClicked = false;
    }

    create() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        const canvas = document.querySelector("canvas");

        if (canvas === null) throw new Error("No canvas");

        canvas.addEventListener("click", this.canvasClickListener);

        this.events.on('shutdown', () => {
            canvas.removeEventListener("click", this.canvasClickListener);
        });


    }

    update() {
        if (this.canvasClicked) {
            this.scene.start('Fighting');
        }
    }
}