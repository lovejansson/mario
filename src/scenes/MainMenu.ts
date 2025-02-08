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
        console.log("INIT MAIN", this.canvasClicked)
        this.canvasClicked = false;
    }

    create() {
        console.log("CREATE MAIN", this.canvasClicked)
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        const canvas = document.querySelector("canvas");

        if (canvas === null) throw new Error("No canvas");

        canvas.addEventListener("click", this.canvasClickListener);

        this.events.on('shutdown', () => {


            this.sound.setMute(true);
            canvas.removeEventListener("click", this.canvasClickListener);
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