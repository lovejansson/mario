import AssetHandler from "./AssetHandler";
import GameObject, { Point } from "./GameObject";
import { keys } from "./globalState";

const MARIO_STARTING_POS: Point = { y: 135 - 32, x: 24 };

enum MarioState {
    IDLE = 0, // when nothing happenes 
    WALKING = 1 << 0, // when key a or d
    JUMPING = 1 << 1, // When press SPACE causes this state 
    PICKING_ITEM = 1 << 2, // key s
    HOLDING_ITEM = 1 << 3,
    THROWING_ITEM = 1 << 4, // when Press ENTER causes this state
}

export class Mario implements GameObject {
    pos: Point;
    vel: Point;

    private state: number;
    private walkFrame: 0 | 1 | 2 | 3 | undefined;
    private dir: "right" | "left";

    private prevMillis: number | undefined;
    private jumpStartMillis: number;
    private elapsedMillisDiff: number;

    constructor() {
        this.pos = { ...MARIO_STARTING_POS };
        this.vel = { x: 0, y: 0 };
        this.state = MarioState.IDLE;
        this.elapsedMillisDiff = 0;
        this.dir = "right";
        this.prevMillis = undefined;
        this.jumpStartMillis = 0;
    }

    init() {
        const assetHandler = AssetHandler.getInstance();

        assetHandler.register("walk-right-0", "./assets/mario-walk-right-0.png");
        assetHandler.register("walk-right-1", "./assets/mario-walk-right-1.png");
        assetHandler.register("walk-right-2", "./assets/mario-walk-right-2.png");
        assetHandler.register("walk-left-0", "./assets/mario-walk-left-0.png");
        assetHandler.register("walk-left-1", "./assets/mario-walk-left-1.png");
        assetHandler.register("walk-left-2", "./assets/mario-walk-left-2.png");
        assetHandler.register("walk-lift-0", "./assets/mario-lift-0.png");
        assetHandler.register("walk-lift-1", "./assets/mario-lift-1.png");
        /*       assetHandler.register("walk-lift-right-0", "./assets/mario-lift-walk-right-0.png");
                assetHandler.register("walk-lift-right-1", "./assets/mario-lift-walk-right-1.png");
                assetHandler.register("walk-lift-right-2", "./assets/mario-lift-walk-right-2.png");
                assetHandler.register("walk-lift-left-0", "./assets/mario-lift-walk-left-0.png");
                assetHandler.register("walk-lift-left-1", "./assets/mario-lift-walk-left-1.png");
                assetHandler.register("walk-lift-left-2", "./assets/mario-lift-walk-left--right-2.png"); */
    }

    update(elapsedMillis: number) {

        this.updateStateBasedOnKeys();
        this.updateVelocity();
        this.updateFrame(elapsedMillis);
        this.updatePosition(elapsedMillis);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.getCurrentAsset(), this.pos.x, this.pos.y);
    }


    private updateStateBasedOnKeys() {

        // Check walking state if not jumping is in progress

        if (!(this.state & MarioState.JUMPING)) {
            if (keys["a"] && !keys["d"]) {
                if (!(this.state & MarioState.WALKING)) this.state += MarioState.WALKING;
                this.dir = "left";

            } else if (!keys["a"] && keys["d"]) {
                if (!(this.state & MarioState.WALKING)) this.state += MarioState.WALKING;
                this.dir = "right";
            } else if (!(keys["a"] || keys["d"]) && (this.state & MarioState.WALKING)) {
                this.state -= MarioState.WALKING;
            }
        }

        // check jump initialization
        if (keys[" "] && !(this.state & MarioState.JUMPING)) {
            this.state += MarioState.JUMPING;
            if ((this.state & MarioState.WALKING)) this.state -= MarioState.WALKING;
        }

    }

    private updatePosition(elapsedMillis: number) {
        this.pos.x += this.vel.x;

        if (this.state & MarioState.JUMPING) {

            if (!this.jumpStartMillis) this.jumpStartMillis = elapsedMillis;
            const marioY = this.getMarioJumpPos(elapsedMillis - this.jumpStartMillis);

            if (marioY > MARIO_STARTING_POS.y) {
                this.state -= MarioState.JUMPING;
                this.pos.y = MARIO_STARTING_POS.y;
                this.jumpStartMillis = 0;
            } else {
                this.pos.y = marioY;

            }
        } else {
            this.pos.y = MARIO_STARTING_POS.y;
        }
    }

    private updateFrame(elapsedMillis: number) {

        switch (this.state) {
            case MarioState.WALKING:


                if (this.prevMillis === undefined) {


                    this.prevMillis = elapsedMillis;

                    this.advWalkFrame();
                } else {

                    // Change sprite image every 150 ms
                    this.elapsedMillisDiff += (elapsedMillis - this.prevMillis);
                    this.prevMillis = elapsedMillis;

                    if (this.elapsedMillisDiff >= 150) {

                        this.advWalkFrame();
                        this.elapsedMillisDiff = 0;
                    }
                }

                break;
            default:
                break;
            /* case MarioState.WALKING_LIFTING:
                break;
            case MarioState.IDLE:
                break;
            case MarioState.IDLE_LIFTING:
                break;
            case MarioState.LIFTING:
                break;
            case MarioState.THROWING:
                break;
            case MarioState.JUMPING:
                break;
            case MarioState.JUMPING_LIFTING:
                break; */
        }

    }

    private updateVelocity() {
        if (this.state & MarioState.WALKING) {
            this.vel.x = this.dir === "right" ? 1 : -1;
        } else if (this.state & MarioState.JUMPING) {
            this.vel.x = this.dir === "right" ? 1.5 : -1.5;
        } else {
            this.vel.x = 0;
        }
    }

    private getCurrentAsset(): HTMLImageElement {

        const assetHandler = AssetHandler.getInstance();

        if (this.state & (MarioState.WALKING)) {
            switch (this.walkFrame) {
                case 0:
                    return this.dir === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
                case 1:
                    return this.dir === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
                case 2:
                    return this.dir === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
                case 3:
                    return this.dir === "right" ? assetHandler.get("walk-right-2") : assetHandler.get("walk-left-2");
                default:
                    return this.dir === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
            }

        } else if (this.state & MarioState.JUMPING) {
            return this.dir === "right" ? assetHandler.get("walk-right-1") : assetHandler.get("walk-left-1");
        } else {
            return this.dir === "right" ? assetHandler.get("walk-right-0") : assetHandler.get("walk-left-0");
        }


    }

    private advWalkFrame() {

        if (this.walkFrame === undefined) {
            this.walkFrame = 0;
        } else {
            this.walkFrame = this.walkFrame === 3 ? 0 : this.walkFrame + 1 as (0 | 1 | 2 | 3 | undefined);
        }
    }

    private getMarioJumpPos(jumpMillis: number) {
        /* 
            f(t) = at² + bt + c
            f(t) is the vertical position, relative to the ground
            t is the time since the start of the jump
            a relates to gravity (it's negative, because it points downwards)
            b relates to velocity, or more specifically, the initial jump velocity (it's positive, because it points upwards)
        */
        const t = jumpMillis / 100;
        return MARIO_STARTING_POS.y - (50 * t - 10 * Math.pow(t, 2));
    }

}

