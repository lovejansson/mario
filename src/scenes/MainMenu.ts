import { Scene } from 'phaser';

export class MainMenu extends Scene {

    shouldStartFighting!: boolean;

    private appClickListener: () => void;
    private appMessageListener: (e: MessageEvent) => void;


    constructor() {
        super('MainMenu');
        this.appClickListener = () => {
            this.shouldStartFighting = true;
        };

        this.appMessageListener = (e) => {
          if(e.data.action === "toggle-play-pause"){
            this.shouldStartFighting = true;
          }
        }
    }

    init() {
        this.shouldStartFighting = false;
    }

    create() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(0, 0, 'start-screen').setOrigin(0);

        const audioPlayerEl = document.querySelector("audio-player");

        if(audioPlayerEl === null) throw new Error("No audio player");

        audioPlayerEl.addEventListener("play", this.appClickListener);
        addEventListener("message", this.appMessageListener);

        this.events.on('shutdown', () => {
            audioPlayerEl.removeEventListener("play", this.appClickListener);
            removeEventListener("message", this.appMessageListener);
        });
    }

    update() {
        if (this.shouldStartFighting) {
            this.scene.start('Fighting');
        }
    }
}