export type Point = {
    x: number;
    y: number;
}

export const enum GameObjectKind {
    MARIO,
    DRAGON,
    EGG
}

export interface GameObject {
    id: string;
    kind: GameObjectKind,
    pos: Point;
    vel: Point;

    getCollisionBox: () => CollisionBox;
    init: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (elapsedMillis: number, keys: KeyState, collisions: Collision[], connections: ConnectedObjects) => boolean | void;
}

export type ConnectedObjects = [[string, string]];

export type Collision = {
    obj: GameObject,
    collisionPoint: "east" | "west" | "south" | "north";
}

export type CollisionBox = {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export type KeyState = { [key: string]: boolean };


