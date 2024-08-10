import AssetHandler from "./AssetHandler";
import GameObject from "./GameObject";
import { keys } from "./globalState";
import { Mario } from "./Mario";

const canvas = document.querySelector("canvas");

let gameObjects: GameObject[] = [];

if (canvas === null) throw new Error("canvas is null");

const ctx = canvas.getContext("2d");

if (ctx === null) throw new Error("ctx is null");

init().then(() => play(ctx));


async function init() {
    const mario = new Mario();


    mario.init();

    const assetHandler = AssetHandler.getInstance();

    assetHandler.register("background", "./assets/background.png");

    await assetHandler.load();

    gameObjects.push(mario);

    addEventListener("keydown", (e) => {
        if (e.key === "a" || e.key === "d" || e.key === " " || e.key === "s") {
            keys[e.key] = true;
        }
    });

    addEventListener("keyup", (e) => {
        if (e.key === "a" || e.key === "d" || e.key === " " || e.key === "s")
            keys[e.key] = false;

    });
}

function play(ctx: CanvasRenderingContext2D, elapsedMillis?: number) {
    if (elapsedMillis) {
        update(elapsedMillis);
    }

    draw(ctx);
    requestAnimationFrame((elapsedMillis) => play(ctx, elapsedMillis));
}

function update(elapsedMillis: number) {

    for (const obj of gameObjects) {
        obj.update(elapsedMillis);
    }
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

