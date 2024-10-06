import { Point } from "./types";

/**
 * Calculates the distance between two points using the Pythagorean Theorem.
 * @param p1 
 * @param p2 
 * @returns the distance between two points.
 */
function dist(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}


function sample<T>(list: T[]) {
    return list[Math.floor(Math.random() * list.length)]
}

function isBetween(num: number, start: number, end: number) {
    return num >= start && num <= end;
}

function isOutsideOf(num: number, start: number, end: number) {
    return !isBetween(num, start, end);
}

export { dist, sample, isBetween, isOutsideOf };