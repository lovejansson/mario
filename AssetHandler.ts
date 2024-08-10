export default class AssetHandler {
    private static instance: AssetHandler;

    private assets: Map<string, HTMLImageElement>;
    private paths: Map<string, string>;

    // Private constructor to prevent instantiation
    private constructor() {
        this.assets = new Map();
        this.paths = new Map();
    }

    // Public method to get the single instance
    public static getInstance(): AssetHandler {
        if (!AssetHandler.instance) {
            AssetHandler.instance = new AssetHandler();
        }
        return AssetHandler.instance;
    }

    public register(name: string, path: string) {
        this.paths.set(name, path);
    }

    public async load() {
        const loadPromises: Promise<[string, HTMLImageElement]>[] = [];

        for (const [name, path] of this.paths.entries()) {

            const image = new Image();
            const loadPromise = new Promise<[string, HTMLImageElement]>((resolve, reject) => {
                image.addEventListener("load", () => {
                    resolve([name, image]);
                });

                image.addEventListener("error", (e) => {
                    reject(new LoadAssetError(name, path, e.error));

                });

            });

            image.src = path;
            loadPromises.push(loadPromise);

            try {
                const loadedAssets = await Promise.all(loadPromises);
                this.assets = new Map(loadedAssets);

            } catch (e) {
                throw e;
            }

        }
    }

    /**
     * Get the specifiec image for drawing onto canvas
     * @param name - The name of the image.
     * @returns The image.
     * @throws {AssetNotLoadedError} If no image have been registered/loaded i.e. doesn't exist in the assets Map.
     */
    public get(name: string): HTMLImageElement {
        const image = this.assets.get(name);

        if (!image) throw new AssetNotLoadedError(name);

        return image;
    }

}


class AssetNotLoadedError extends Error {
    constructor(assetName: string) {
        super(`Asset: ${assetName} not loaded`);
    }
}

class LoadAssetError extends Error {
    constructor(name: string, path: string, inner: any) {
        super(`Failed to load asset: ${name} at: ${path} bc: ${inner}`);
    }
}