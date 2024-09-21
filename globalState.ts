import { GameObject, KeyState } from "./types";

export let isDebugMode = true;

export const keys: KeyState = {};

export let gameObjects: GameObject[] = [];

export function reassignGameObjects(updated: GameObject[]) {
    gameObjects = updated
}