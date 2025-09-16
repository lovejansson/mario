


import { Game, Types } from "phaser";
import { MainMenu } from "./scenes/MainMenu";
import { Fighting } from "./scenes/Fighting";
import { Preloader } from "./scenes/Preloader";
import { Boot } from "./scenes/Boot";

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 320,
    height: 180,
    pixelArt: true,
    parent: "app",
    backgroundColor: "transparent",
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000, x: 0 },
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Fighting,
    ],
};



export default new Game(config);


