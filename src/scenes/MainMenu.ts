import { Scene } from 'phaser';

export class MainMenu extends Scene {

    shouldStartFighting!: boolean;

    private appClickListener: () => void;
    private appMessageListener: (e: MessageEvent) => void;
    private keyDownListener: (e: KeyboardEvent) => void;


    constructor() {
        super('MainMenu');
        this.appClickListener = () => {
            this.shouldStartFighting = true;
        };

        this.appMessageListener = (e) => {
          if(e.data.action === "toggle-play-pause"){
            this.shouldStartFighting = true;
          } else if(e.data.action === "enter-fullscreen") {
         
            if(document.fullscreenElement === null) {
                const app = document.querySelector("#app");
                if(app) {
                    app.requestFullscreen();
                }
            } else {
                console.warn("An element is already in full screen: ", document.fullscreenElement);
            }
          }else if(e.data.action === "art-lost-focus") {
            (document.activeElement as HTMLElement)?.blur();
        }
        } 

        this.keyDownListener = (e: KeyboardEvent) => {
              if (e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                this.shouldStartFighting = true;
            } else if(e.key === "f" || e.key === "F") {
                
                if(document.fullscreenElement === null) {
                    const app = document.querySelector("#app");
                    if(app) {
                        app.requestFullscreen();
                    }
                } else {
                    console.warn("An element is already in full screen: ", document.fullscreenElement);
                }
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
        addEventListener("keydown", this.keyDownListener);

        this.events.on('shutdown', () => {
            audioPlayerEl.removeEventListener("play", this.appClickListener);
            removeEventListener("message", this.appMessageListener);
            removeEventListener("keydown", this.keyDownListener);
        });
    }

    update() {
        if (this.shouldStartFighting) {
            this.scene.start('Fighting');
        }
    }
}