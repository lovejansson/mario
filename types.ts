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
    pos: Point;
    vel: Point;

    getCollisionBox: () => CollisionBox;
    init: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (elapsedMillis: number, keys: KeyState, collisions: Collision[]) => boolean | void;
}

export type Collision = {
    obj: GameObject,
    collisionPoint: "east" | "west" | "south" | "north";
}

export type CollisionBox = {
    x: number;
    w: number;
    y: number;
    h: number;
}

export type KeyState = { [key: string]: boolean };


