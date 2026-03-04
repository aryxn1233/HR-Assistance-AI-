"use client";

/**
 * AudioAnalyserService
 * Manages AudioContext and AnalyserNode for real-time audio analysis.
 */
class AudioAnalyserService {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: AudioNode | null = null;
    private audio: HTMLAudioElement | null = null;
    private dataArray: Uint8Array | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    /**
     * Initialize the analyser with a source URL
     */
    async initialize(audioUrl: string): Promise<void> {
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Cleanup previous
        this.cleanup();

        this.audio = new Audio(audioUrl);
        this.audio.crossOrigin = "anonymous";

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
    }

    /**
     * Start playing
     */
    play(): void {
        if (this.audio) {
            this.audio.play();
        }
    }

    /**
     * Stop playing
     */
    stop(): void {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }

    /**
     * Get real-time amplitude data
     */
    getAmplitude(): number {
        if (!this.analyser || !this.dataArray) return 0;

        (this.analyser as any).getByteFrequencyData(this.dataArray);

        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }

        const average = sum / this.dataArray.length;
        return average / 255; // Normalize to 0-1
    }

    /**
     * Check if audio is playing
     */
    isPlaying(): boolean {
        return this.audio ? !this.audio.paused : false;
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
    }
}

export const audioAnalyserService = new AudioAnalyserService();
