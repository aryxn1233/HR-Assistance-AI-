"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useWebSpeech() {
    const [interimTranscript, setInterimTranscript] = useState("");
    const [finalTranscript, setFinalTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            setIsSupported(false);
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += text + " ";
                } else {
                    interim += text;
                }
            }

            if (final) {
                setFinalTranscript(prev => prev + final);
            }
            setInterimTranscript(interim);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript("");
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'no-speech') {
                console.warn("Speech recognition error:", event.error);
            }
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsSupported(false);
            }
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        // Reset transcripts for a fresh start
        setFinalTranscript("");
        setInterimTranscript("");
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            // Already running — stop and restart
            recognitionRef.current.stop();
            setTimeout(() => {
                setFinalTranscript("");
                setInterimTranscript("");
                recognitionRef.current?.start();
                setIsListening(true);
            }, 300);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setFinalTranscript("");
        setInterimTranscript("");
    }, []);

    return {
        transcript: finalTranscript,         // confirmed spoken text
        interimTranscript,                   // live in-progress text
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
    };
}
