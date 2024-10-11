import AssetHandler from "./AssetHandler";
import { gameObjects, isDebugMode, keys, reassignGameObjects } from "./globalState";
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

        const deleteObj = obj.update(elapsedMillis, keys, collisions);

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


function getCollisionPoint(obj1: GameObject, obj2: GameObject): "east" | "west" | "south" | "north" | null {

    const box1 = obj1.getCollisionBox();
    const box2 = obj2.getCollisionBox();

    const box1XEnd = box1.x + box1.w;
    const box1YEnd = box1.y + box1.h;
    const box2XEnd = box2.x + box2.w;
    const box2YEnd = box2.y + box2.h;

    // Check if there is a collision between the two boxes
    if (!(box1.x > box2XEnd || box1XEnd < box2.x || box1.y > box2YEnd || box1YEnd < box2.y)) {

        // Determine the side of collision by comparing the collision overlaps in y and x directions

        const box1HalfW = box1.w / 2;
        const box2HalfW = box2.w / 2;
        const box1HalfH = box1.h / 2;
        const box2HalfH = box2.h / 2;

        const box1CenterX = box1.x + box1HalfW;
        const box2CenterX = box2.x + box2HalfW;
        const box1CenterY = box1.y + box1HalfH;
        const box2CenterY = box2.y + box2HalfH;

        const distX = box1CenterX - box2CenterX;
        const distY = box1CenterY - box2CenterY;

        // The max distance between is the distance between the two centers if they where perfectly aligned with eachother side by side. If the distance is greater, it means that the boxes are not touching.
        // The boxes should be touching here since we already checked for that. So, the max distance is used to calculate the overlap in each direction. 

        const maxDistX = box1HalfW + box2HalfW;
        const maxDistY = box1HalfH + box2HalfH;


        const overlapX = distX > 0 ? maxDistX - distX : -maxDistX - distX;
        const overlapY = distY > 0 ? maxDistY - distY : -maxDistY - distY;

        if (overlapY !== 0 && overlapX !== 0) {

            // If the overlap in the y direction is bigger than in the x direction we decide that the collision accours in the x direction. Draw this out on paper to get it. 
            if (Math.abs(overlapY) > Math.abs(overlapX)) {
                // Collision in x direction

                if (overlapX > 0) {

                    return "west"
                } else {

                    return "east"
                }
            } else {
                // Collision in y direction
                if (overlapY > 0) {

                    return "north"
                }

                return "south"
            }
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
        if (isDebugMode) {
            const box = obj.getCollisionBox();

            ctx.imageSmoothingEnabled = false;
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1;
            ctx.strokeRect(box.x - 0.5, box.y - 0.5, box.w, box.h);
        }
    }

}

