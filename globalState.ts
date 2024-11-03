import { GameObject, GameState } from "./types";

export let isDebugMode = true;

export let gameObjects: GameObject[] = [];

export let gameState = GameState.FIGHTING;

export function reassignGameObjects(updated: GameObject[]) {
    gameObjects = updated
}

export function setGameState(newState: GameState) {
    gameState = newState;
}