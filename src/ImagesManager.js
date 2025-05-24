export default class ImagesManager {

    /**
     * @type {Map<string, HTMLImageElement>}
     * @description A map that stores images, where the key is the image name and the value is the corresponding HTMLImageElement.
     */
    _images;

    /**
     * @type {Map<string, string>}
     * @description A map that stores the source URLs of images, where the key is the image name and the value is the source URL.
     */
    _srcs;


    constructor() {
        this._images = new Map();
        this._srcs = new Map();
    }

    /**
     * Adds an image.
     * 
     * @param {string} name The name of the image.
     * @param {string} src The source URL of the image image.
     */
    add(name, src) {
        this._srcs.set(name, src);
    }

    /**
     * Loads all images that have been registered. Each registered image will be fetched from its URL.
     * 
     * @returns {Promise<void>} A promise that resolves once all images are successfully loaded.
     */
    async load() {
        /**
         * @type {Promise<[string, HTMLImageElement][]>}
         * @description An array of promises that resolve to an array containing the image name and its corresponding image.
         */
        const loadPromises = [];

        for (const [name, src] of this._srcs.entries()) {
            const image = new Image();
    
            const loadPromise = new Promise((resolve, reject) => {
                image.addEventListener("load", () => {
                    resolve([name, image]);
                });

                image.addEventListener("error", (e) => {
                    reject(new LoadimageError(name, src, e.error));
                });
            });

            image.src = src;
            loadPromises.push(loadPromise);
        }

        try {
            const loadedimages = await Promise.all(loadPromises);
            this._images = new Map(loadedimages);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Retrieves the image element associated with a given image name.
     * 
     * @param {string} name The name of the image.
     * @returns {HTMLImageElement} The image element corresponding to the image name.
     * @throws {ImageNotLoadedError} Throws an error if the image has not been loaded.
     */
    get(name) {
        const image = this._images.get(name);

        if (!image) throw new ImageNotLoadedError(name);

        return image;
    }
}

/**
 * Custom error thrown when an image is requested but has not been loaded.
 */
class ImageNotLoadedError extends Error {
    /**
     * @param {string} imageName The name of the image that was not loaded.
     */
    constructor(imageName) {
        super(`image: ${imageName} not loaded`);
    }
}

/**
 * Custom error thrown when there is a failure to load an image.
 */
class LoadimageError extends Error {
    /**
     * @param {string} name The name of the image that failed to load.
     * @param {string} src The source URL of the image.
     * @param {string} inner The inner error message.
     */
    constructor(name, src, inner) {
        super(`Failed to load image: ${name} at: ${src} bc: ${inner}`);
    }
}

