"use client";

import { useState, useEffect, useRef } from "react";

import { audioAnalyserService } from "@/lib/AudioAnalyserService";
import { avatarStateManager } from "@/lib/InterviewAvatarStateManager";

export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            synth.current = window.speechSynthesis;
        }
    }, []);

    const speak = async (text: string, audioUrl?: string) => {
        // Notify HeyGen (This will be the primary voice if HeyGen is active)
        window.dispatchEvent(new CustomEvent("heygen-speak", { detail: { text } }));

        // Stop any current playback
        stop();

        if (audioUrl) {
            // Use custom audio pipeline for lip-sync
            try {
                avatarStateManager.setSPEAKING();
                await audioAnalyserService.initialize(audioUrl);
                audioAnalyserService.play();
                setIsSpeaking(true);

                const audio = (audioAnalyserService as any).audio;
                if (audio) {
                    audio.onended = () => {
                        setIsSpeaking(false);
                        avatarStateManager.setIDLE();
                    };
                }
                return;
            } catch (error) {
                console.error("Failed to play audio stream, falling back to synthesis", error);
            }
        }

        // Fallback or secondary: Web Speech API
        // NOTE: We could comment this out if HeyGen is supposed to take over entirely
        // but keeping it as fallback ensures the interview continues if HeyGen fails.
        if (!synth.current) return;

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synth.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            setIsSpeaking(true);
            avatarStateManager.setSPEAKING();
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            avatarStateManager.setIDLE();
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            avatarStateManager.setIDLE();
        };

        synth.current.speak(utterance);
    };

    const stop = () => {
        if (synth.current) {
            synth.current.cancel();
        }
        audioAnalyserService.stop();
        setIsSpeaking(false);
        avatarStateManager.setIDLE();
    }

    return { speak, stop, isSpeaking };
}
