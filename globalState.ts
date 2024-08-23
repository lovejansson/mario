import { GameObject, KeyState } from "./types";

export const keys: KeyState = {};

export let gameObjects: GameObject[] = [];

export function reassignGameObjects(updated: GameObject[]) {
    gameObjects = updated
}