import AssetHandler from "./AssetHandler";
import { connections, gameObjects, keys, reassignGameObjects } from "./globalState";
import { Mario } from "./Mario";
import { Dragon } from "./Dragon";
import { GameObject, Collision } from "./types";

const listenToKeys = ["a", "d", "s", " ", "ö"]

const canvas = document.querySelector("canvas");

if (canvas === null) throw new Error("canvas is null");

const ctx = canvas.getContext("2d");

if (ctx === null) throw new Error("ctx is null");

init().then(() => play(ctx));


async function init() {

    ctx!.imageSmoothingEnabled = false;

    const mario = new Mario();

    const dragon = new Dragon();

    mario.init();

    dragon.init();

    const assetHandler = AssetHandler.getInstance();

    assetHandler.register("background", "./assets/background.png");

    await assetHandler.load();

    gameObjects.push(mario);
    gameObjects.push(dragon);

    addEventListener("keydown", (e) => {
        if (listenToKeys.includes(e.key)) {
            keys[e.key] = true;
        }
    });

    addEventListener("keyup", (e) => {
        if (listenToKeys.includes(e.key)) {
            keys[e.key] = false;
        }
    });
}

function play(ctx: CanvasRenderingContext2D, elapsedMillis?: number) {

    update(elapsedMillis ?? 0);
    draw(ctx);
    requestAnimationFrame((elapsedMillis) => play(ctx, elapsedMillis));
}

function update(elapsedMillis: number) {

    const objToDelete: number[] = [];

    for (const [idx, obj] of Object.entries(gameObjects)) {
        const collisions = getCollisions(parseInt(idx));

        const deleteObj = obj.update(elapsedMillis, keys, collisions, connections);

        if (deleteObj) {
            objToDelete.push(parseInt(idx));
        }
    }

    reassignGameObjects(gameObjects.filter((_, idx) => !objToDelete.includes(idx)));
}

function getCollisions(index: number) {
    const collisions: Collision[] = []
    for (const [idx, obj] of Object.entries(gameObjects)) {
        if (parseInt(idx) !== index) {
            // Check if colliding and where 
            const collisionPoint = getCollisionPoint(gameObjects[index], obj);
            if (collisionPoint) {
                collisions.push({ obj, collisionPoint });
            }
        }
    }

    return collisions;
}


function isInInterval(num: number, interval: { start: number, end: number }) {
    return num >= interval.start && num <= interval.end;
}


function getCollisionPoint(obj1: GameObject, obj2: GameObject): "east" | "west" | "south" | "north" | null {
    const box1 = obj1.getCollisionBox();
    const box2 = obj2.getCollisionBox();

    // Checks if any combination of x and y of obj1 is within/in between obj2's area. 

    if (!(box1.x1 > box2.x2 || box1.x2 < box2.x1 || box1.y1 > box2.y2 || box1.y2 < box2.y1)) {
        if (isInInterval(box1.y2, { start: box2.y1, end: box2.y2 })) {
            return "south"
        }

        if (isInInterval(box1.y1, { start: box2.y1, end: box2.y2 })) {
            return "north"
        }

        if (isInInterval(box1.x2, { start: box2.x1, end: box2.x2 })) {
            return "east"
        }
        if (isInInterval(box1.x1, { start: box2.x1, end: box2.x2 })) {
            return "west"
        }
    }

    return null;

}

function draw(ctx: CanvasRenderingContext2D) {

    const backgroundImage = AssetHandler.getInstance().get("background");

    ctx.canvas.width = backgroundImage.width;
    ctx.canvas.height = backgroundImage.height;

    ctx.clearRect(0, 0, backgroundImage.width, backgroundImage.height);
    ctx.drawImage(backgroundImage, 0, 0);

    for (const obj of gameObjects) {
        obj.draw(ctx);
    }

}

