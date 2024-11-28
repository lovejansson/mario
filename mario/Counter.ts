export default class Counter {
    frames: number = 0;

    tick() {
        this.frames++;
    }

    reset() {
        this.frames = 0;
    }

}