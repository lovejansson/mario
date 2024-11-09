export default class AudioHandler {

    private static instance: AudioHandler;

    private onoff: boolean;

    private audioMap: Map<string, AudioBuffer>;
    private playingAudioNodes: Map<string, AudioBufferSourceNode>;
    private audioCtx: AudioContext;
    private volumeNode: GainNode;


    private constructor() {
        this.audioMap = new Map();
        this.playingAudioNodes = new Map();
        this.onoff = false;

        this.audioCtx = new AudioContext();

        this.volumeNode = this.audioCtx.createGain();

        this.volumeNode.connect(this.audioCtx.destination);
    }

    public static getInstance(): AudioHandler {
        if (!AudioHandler.instance) {
            AudioHandler.instance = new AudioHandler();
        }
        return AudioHandler.instance;
    }

    public stopAudio(id: string) {
        const source = this.playingAudioNodes.get(id);

        if (source) {
            source.stop();
        }

    }

    public playAudio(id: string, loop: boolean = false) {

        if (this.onoff) {

            const alreadyPlayingNode = this.playingAudioNodes.get(id);

            if (alreadyPlayingNode) {
                return;
            }

            // check if context is in suspended state (autoplay policy)
            if (this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }

            const audioBuffer = this.audioMap.get(id);


            if (!audioBuffer) throw new AudioNotFoundError(id);

            const audioSource = this.audioCtx.createBufferSource();
            audioSource.buffer = audioBuffer;

            audioSource.loop = loop;

            audioSource.connect(this.volumeNode);

            audioSource.start();

            // Save the source node so it can be stopped via stopAudio
            this.playingAudioNodes.set(id, audioSource);

            // Add event listener to delete the source node when it has stopped playing
            audioSource.addEventListener("ended", () => {
                this.playingAudioNodes.delete(id);
            });
        }

    }

    public setVolume(volume: number) {
        if (volume < 0 || volume > 1) throw new InvalidVolumeRangeError(volume);

        this.volumeNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    }

    public async createAudio(id: string, path: string) {

        try {
            // Load an audio file
            const response = await fetch(path);
            // Decode it
            const audioBuffer = await this.audioCtx.decodeAudioData(await response.arrayBuffer());

            this.audioMap.set(id, audioBuffer);
        } catch (err) {
            throw new AudioFetchError(path, err as Error);
        }
    }

    public onOffSwitch() {
        this.onoff = !this.onoff;

        if (!this.onoff) {
            this.turnOffAllAudios();
        }
    }

    public isOn() {
        return this.onoff;
    }

    private turnOffAllAudios() {

        for (const audioSource of this.playingAudioNodes.values()) {
            audioSource.stop()

        }
    }
}

class InvalidVolumeRangeError extends Error {
    constructor(volume: number) {
        super(`Volume: ${volume} is not within valid range 0-1.`);
    }
}

class AudioNotFoundError extends Error {
    constructor(id: string) {
        super(`Audio with id: ${id} does not exist.`);
    }
}

class AudioFetchError extends Error {
    constructor(path: string, error: Error) {
        super(`Unable to fetch audio file: ${path}. Error: ${error.message}`);
    }
}