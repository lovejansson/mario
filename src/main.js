


import Art from "./Art.js";
import FightingScene from "./FightingScene.js";
import PauseScene from "./PauseScene.js";

new Art({width: 320, height: 180, play: new FightingScene(), pause: new PauseScene() }).play();
