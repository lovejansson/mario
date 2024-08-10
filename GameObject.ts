export type Point = {
    x: number;
    y: number;
}

export default interface GameObject {
    pos: Point;
    vel: Point;
    init: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (elapsedMillis: number) => void;
}
