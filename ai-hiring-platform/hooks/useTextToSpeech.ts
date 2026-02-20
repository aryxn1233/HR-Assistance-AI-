"use client";

import { useState, useEffect, useRef } from "react";

export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            synth.current = window.speechSynthesis;
        }
    }, []);

    const speak = (text: string) => {
        if (!synth.current) return;

        // Cancel current speech
        synth.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Select Voice (Optional: prefer Google US English or similar)
        const voices = synth.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synth.current.speak(utterance);
    };

    const stop = () => {
        if (synth.current) {
            synth.current.cancel();
            setIsSpeaking(false);
        }
    }

    return { speak, stop, isSpeaking };
}
