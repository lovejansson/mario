


import { Game, Types } from "phaser";
import { MainMenu } from "./scenes/MainMenu";
import { Fighting } from "./scenes/Fighting";
import { Preloader } from "./scenes/Preloader";
import { Boot } from "./scenes/Boot";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 320,
    height: 180,
    pixelArt: true,
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
