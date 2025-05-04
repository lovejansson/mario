import "./array.js";
import { getSongs } from "./youtube.js";

const playIcon = '<svg class="icon" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" fill="currentColor"/> </svg>';
const pauseIcon = '<svg class="icon" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M10 4H5v16h5V4zm9 0h-5v16h5V4z" fill="currentColor"/> </svg>';

const MAX_VOLUME = 100;
const DEFAULT_VOLUME = 20;
const VOLUME_STEP = 20;
const DEBUG = true;

const PlayerStates = new Map([
    [-1, "unstarted"],
    [0, "ended"],
    [1, "playing"],
    [2, "paused"],
    [3, "buffering"],
    [5, "video cued"],
]);


export default class MusicPlayer extends HTMLElement {
    static observedAttributes = ["channel", "playlist"];

    youTubePlayer;
    
    /**
     * @type {HTMLDivElement}
     */
    volumeControl;

    /**
     * @type {HTMLParagraphElement}
     */
    songTitle;

    /**
     * @type {number}
     */
    volume;

    constructor() {
        super();
        const template = document.getElementById("template-music-player");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
        this.volume = DEFAULT_VOLUME;
    }

    async connectedCallback() {
        if(DEBUG) console.log(`Connected music player element: ${this.getAttribute("channel")} ${this.getAttribute("playlist")}`);

        const playerContainer = this.shadowRoot.querySelector("#player-container");
        const player = this.shadowRoot.querySelector("#player");
        const btnPlayPause = this.shadowRoot.querySelector("#btn-play-pause");
        const btnShuffle =  this.shadowRoot.querySelector("#btn-shuffle");
        const volumeControl =  this.shadowRoot.querySelector("#volume-control");
        const songTitle =  this.shadowRoot.querySelector("#song-title");
        const youtubePlayerDiv = this.shadowRoot.querySelector("#youtube-player");

        if(!playerContainer) throw new Error("Missing DOM element: player container");
        if(!player) throw new Error("Missing DOM element: player");
        if (!youtubePlayerDiv) throw new Error("Missing DOM element: youtube-player");
        if (!btnPlayPause) throw new Error("Missing DOM element: btnPlayPause");
        if (!btnShuffle) throw new Error("Missing DOM element: btnShuffle");
        if (!volumeControl) throw new Error("Missing DOM element: volumeControl");
        if (!songTitle) throw new Error("Missing DOM element: songTitle");

        playerContainer.style.display = "none";

        this.songTitle = songTitle
        this.songs = await getSongs(this.getAttribute("channel"), this.getAttribute("playlist"));
        this.volumeControl = volumeControl;
        this.btnPlayPause = btnPlayPause;

        this.youTubePlayer = new YT.Player(youtubePlayerDiv, {
            videoId: this.songs.random(),
            height: "1px",
            width: "1px",
            events: {
                'onReady': () => {
                    this.pickSong();
                    playerContainer.style.display = "flex";
                    this.dispatchEvent(new CustomEvent("ready"));
                } ,
                'onStateChange': this.handlePlayerStateChange.bind(this),
            },
        });

        this.initVolumeControl(DEFAULT_VOLUME);

        this.btnPlayPause.addEventListener("click", () => {
            if (this.youTubePlayer && this.youTubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                this.dispatchEvent(new CustomEvent("pause"));
                this.pause();
            } else {
                this.dispatchEvent(new CustomEvent("play"));
                this.play();
            }

        
        });

        playerContainer.addEventListener("click", (e) => {
            if (this.youTubePlayer && this.youTubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                this.dispatchEvent(new CustomEvent("pause"));
                this.pause();
            } else {
                this.dispatchEvent(new CustomEvent("play"));
                this.play();
            }
        });

        player.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        
        btnShuffle.addEventListener("click", (e) => {
            if (this.youTubePlayer && this.youTubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                this.pickSong();
            }
        });

    }


    attributeChangedCallback(name, oldValue, newValue) {
       if(DEBUG) console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}`);
    }


    handlePlayerStateChange(event) {
        if(DEBUG) console.log(`Player state changed: ${PlayerStates.get(event.data) || event.data}`);

        if (event.data === YT.PlayerState.ENDED) {
            if(DEBUG) console.log("Song ended");
            this.pickSong();
            event.target.playVideo();
        }
    }


    pickSong() {
        const song = this.songs.random();
        this.youTubePlayer.loadVideoById(song.videoId);
        this.songTitle.textContent = song.title;
    }


    isOn() {
        return this.youTubePlayer !== undefined && this.youTubePlayer.getPlayerState && this.youTubePlayer.getPlayerState() === YT.PlayerState.PLAYING;
    }


    play() {
        this.youTubePlayer.playVideo();
        this.btnPlayPause.innerHTML = pauseIcon;
    }


    pause() {
        this.youTubePlayer.pauseVideo();
        this.btnPlayPause.innerHTML = playIcon;
    }


    /**
     * Sets click listeners for volume control to change volume and initializes volume
     */
      initVolumeControl() {

        this.volume = DEFAULT_VOLUME;

        const volumeControl =  this.shadowRoot.querySelector("#volume-control");

        for (let i = 0; i < volumeControl.children.length; ++i) {
            const button = volumeControl.children.item(i);

            button.addEventListener("click", (e) => {
                const newVolume = (MAX_VOLUME / 5) * (parseInt(i) + 1);

                this.volume = this.volume === newVolume ? this.volume - MAX_VOLUME / 5 : newVolume;

                this.renderVolume();

                this.dispatchEvent(new CustomEvent("volume", {detail: {volume: this.volume}}));

                e.stopPropagation();

            });
        }

        volumeControl.addEventListener("click", (e) => {
            // Calculate which volume step based on position of click inside the volume control 

            const xInVolumeControl = e.x - volumeControl.getBoundingClientRect().left;

            const newVolume = ((Math.floor(((xInVolumeControl / (volumeControl.clientWidth + 2)) * 100) / VOLUME_STEP)) + 1) * VOLUME_STEP;
            this.volume = this.volume === newVolume ? this.volume - MAX_VOLUME / 5 : newVolume;

            this.renderVolume();

            this.dispatchEvent(new CustomEvent("volume", {detail: {volume: this.volume}}));

            e.stopPropagation();
        });

        this.renderVolume();
    }

    /**
     * Toggles classes for filled sqare or empty square to show volume.
     */
    renderVolume() {

        const volumeControl =  this.shadowRoot.querySelector("#volume-control");

        for (let i = 0; i < volumeControl.children.length; ++i) {

            const button = volumeControl.children.item(i);

            if ((MAX_VOLUME / 5) * (i + 1) <= this.volume) {
                button.classList.add("square-filled");
                button.classList.remove("square-empty");
            } else {
                button.classList.add("square-empty");
                button.classList.remove("square-filled");
            }
        }
    }

}

customElements.define("music-player", MusicPlayer);