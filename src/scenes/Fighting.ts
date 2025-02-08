import { Scene, Types } from 'phaser';
import { Mario } from '../mario/Mario';
import { Birdo, BIRDO_HEIGHT, BIRDO_WIDTH } from '../Birdo';
import { Egg } from '../Egg';
import { Carrot } from '../Carrot';


export enum FightingState {
    INTRO,
    FIGHTING,
    MARIO_WON,
    BIRDO_WON,
}

export const WORLD_WIDTH = 320;
export const WORLD_HEIGHT = 180;

const PLATFORM_BIG_HEIGHT = 32;
const PLATFORM_BIG_POS = { x: 0, y: WORLD_HEIGHT - PLATFORM_BIG_HEIGHT };

export const PLATFORM_BIRDO_WIDTH = 126;
export const PLATFORM_BIRDO_HEIGHT = 13;
export const PLATFORM_BIRDO_POS = { x: WORLD_WIDTH / 2 - PLATFORM_BIRDO_WIDTH / 2, y: PLATFORM_BIG_POS.y - PLATFORM_BIRDO_HEIGHT }


export class Fighting extends Scene {

    mario!: Mario;
    birdo!: Birdo;
    private platformBig!: Types.Physics.Arcade.ImageWithStaticBody;
    private platformBig2!: Types.Physics.Arcade.ImageWithStaticBody;
    private platformBig3!: Types.Physics.Arcade.ImageWithStaticBody;
    private platformBirdo!: Types.Physics.Arcade.ImageWithStaticBody;

    state!: FightingState;

    private canvasClicked!: boolean;


    constructor() {
        super('Fighting');
    }


    init() {
        console.log("UPDATE FIGHTING", this.canvasClicked)
        this.canvasClicked = false;
        this.state = FightingState.INTRO;
    }

    create() {
        console.log("CREATE FIGHTING", this.canvasClicked)
        const canvas = document.querySelector("canvas");

        if (canvas === null) throw new Error("No canvas");

        canvas.addEventListener("click", () => {
            this.canvasClicked = true;
        });

        this.add.image(0, 0, 'background').setOrigin(0);

        this.createPalmTrees();

        this.platformBirdo = this.physics.add.staticImage(PLATFORM_BIRDO_POS.x, PLATFORM_BIRDO_POS.y, "birdo-platform").setOrigin(0).refreshBody();
        this.platformBirdo.name = "birdo-platform";
        this.sound.add("bg-fighting");

        this.events.on('shutdown', () => {
            this.sound.removeAll();
        });

        // Creating all objects and groups in the scene 

        this.platformBig = this.physics.add.staticImage(PLATFORM_BIG_POS.x, PLATFORM_BIG_POS.y, "platform-big").setOrigin(0).refreshBody();

        // Creating two out of world platforms so that mario can catch eggs that goes a little bit out of view. 

        this.platformBig2 = this.physics.add.staticImage(-WORLD_WIDTH, PLATFORM_BIG_POS.y, "platform-big").setOrigin(0).refreshBody();
        this.platformBig3 = this.physics.add.staticImage(+WORLD_WIDTH, PLATFORM_BIG_POS.y, "platform-big").setOrigin(0).refreshBody();

        this.mario = new Mario(this, 0, WORLD_HEIGHT - 32 - PLATFORM_BIG_HEIGHT, "mario-walk");

        this.birdo = new Birdo(this, PLATFORM_BIRDO_POS.x + PLATFORM_BIRDO_WIDTH - BIRDO_WIDTH, PLATFORM_BIRDO_POS.y - BIRDO_HEIGHT, "birdo-walk");

        this.createCarrots();

        // Setting up colliders for objects

        this.physics.add.collider(this.birdo, this.platformBig);

        this.physics.add.collider(this.mario, this.platformBig);

        this.physics.add.collider(this.mario, this.platformBig2);

        this.physics.add.collider(this.mario, this.platformBig3);


        this.physics.add.collider(this.mario, this.birdo, (mario, birdo) => {
            (mario as Mario).handleCollision(birdo);
        });

        this.physics.add.collider(this.birdo, this.platformBirdo);

        this.physics.add.collider(this.mario, this.platformBirdo);

    }


    addEgg(egg: Egg) {
        // The egg constructor itself will add the egg to the scene and connect physics to it. 

        // This method will add colliders between the egg and mario and birdo. 

        this.physics.add.collider(this.mario, egg, (mario, egg) => {
            (mario as Mario).handleCollision(egg);
            (egg as Egg).handleCollision(mario);

        });

        this.physics.add.collider(this.birdo, egg, (birdo, egg) => {
            (birdo as Birdo).handleCollision(egg);
            (egg as Egg).handleCollision(birdo);
        });
    }


    update(_: number, __: number): void {
        console.log("UPDATE FIGHTING", this.canvasClicked)
        if (this.canvasClicked) {
            console.log("STARTING MAIN", this.canvasClicked)
            this.scene.start('MainMenu');
            return;
        }

        if (this.state === FightingState.FIGHTING) {
            if (!this.sound.get("bg-fighting").isPlaying)
                this.sound.get("bg-fighting").play({ loop: true });
        } else {
            if (this.sound.get("bg-fighting").isPlaying)
                this.sound.get("bg-fighting").stop();
        }

        this.birdo.update(this.input.keyboard?.createCursorKeys());
        this.mario.update(this.input.keyboard?.createCursorKeys());

    }


    private createPalmTrees() {
        const PALMTREE_HEIGHT = 57;

        this.add.image(2, WORLD_HEIGHT - PLATFORM_BIG_HEIGHT - PALMTREE_HEIGHT, "palmtree1").setOrigin(0);
        this.add.image(2 + 28, WORLD_HEIGHT - PLATFORM_BIG_HEIGHT - PALMTREE_HEIGHT, "palmtree2").setOrigin(0);
        this.add.image(228, WORLD_HEIGHT - PLATFORM_BIG_HEIGHT - PALMTREE_HEIGHT, "palmtree1").setOrigin(0);
        this.add.image(228 + 28, WORLD_HEIGHT - PLATFORM_BIG_HEIGHT - PALMTREE_HEIGHT, "palmtree2").setOrigin(0);
        this.add.image(228 + 28 * 2, WORLD_HEIGHT - PLATFORM_BIG_HEIGHT - PALMTREE_HEIGHT, "palmtree1").setOrigin(0);
    }


    private createCarrots() {
        const carrot0 = new Carrot(this, 52, PLATFORM_BIG_POS.y - 10, "carrot-ground");
        const carrot1 = new Carrot(this, 52 + 20, PLATFORM_BIG_POS.y - 10, "carrot-ground");
        const carrot2 = new Carrot(this, 246 + 24 * 2, PLATFORM_BIG_POS.y - 10, "carrot-ground");
        const carrot3 = new Carrot(this, 246, PLATFORM_BIG_POS.y - 10, "carrot-ground");
        const carrot4 = new Carrot(this, 246 + 24, PLATFORM_BIG_POS.y - 10, "carrot-ground");

        for (const carrot of [carrot0, carrot1, carrot2, carrot3, carrot4]) {

            const colliderPlatform = this.physics.add.collider(carrot, this.platformBig);
            colliderPlatform.name = "carrot-platform";

            this.physics.add.collider(carrot, this.birdo, (carrot, birdo) => {
                (birdo as Birdo).handleCollision(carrot);
                (carrot as Carrot).handleCollision(birdo);
            });

            this.physics.add.overlap(this.mario, carrot, (mario, carrot) => {
                (mario as Mario).handleOverlap(carrot);
            });

        }
    }
}