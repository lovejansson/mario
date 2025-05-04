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

        const audioPlayerEl = document.querySelector("audio-player");

        if(audioPlayerEl === null) throw new Error("No audio player");

        audioPlayerEl.addEventListener("play", this.appClickListener);

        this.events.on('shutdown', () => {
            audioPlayerEl.removeEventListener("play", this.appClickListener);
        });
    }

    update() {
        if (this.appClicked) {
            this.scene.start('Fighting');
        }
    }
}