import { Scene } from 'phaser';

export class MainMenu extends Scene {

    appClicked!: boolean;

    private appClickListener: () => void;


    constructor() {
        super('MainMenu');
        this.appClickListener = () => {
            this.appClicked = true;
        };
    }

    init() {
        this.appClicked = false;
    }

    create() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        const app = document.querySelector("#app");

        if (app === null) throw new Error("No app");

        app.addEventListener("click", this.appClickListener);

        this.events.on('shutdown', () => {
            app.removeEventListener("click", this.appClickListener);
        });


    }

    update() {
        if (this.appClicked) {
            this.scene.start('Fighting');
        }
    }
}