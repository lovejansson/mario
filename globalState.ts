import { GameObject, KeyState, ConnectedObjects } from "./types";

export const keys: KeyState = {};

export let gameObjects: GameObject[] = [];

export let connections: ConnectedObjects;

export function reassignGameObjects(updated: GameObject[]) {
    gameObjects = updated
}