import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: env.NODE_ENV === "production" ? "/art/mario/" : "/",
        optimizeDeps: {
            include: ["./src/audio-player/AudioPlayer.js"]
        }
    }
})