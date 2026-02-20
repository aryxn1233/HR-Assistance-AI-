"use client";

import { useState, useEffect, useRef } from "react";

export function useWebSpeech() {
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null); // Type check for window.webkitSpeechRecognition

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        // interim
                    }
                }
                // Simplified: just grab the latest
                const current = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join(' ');
                setTranscript(current);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.warn("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    setIsListening(false);
                } else if (event.error === 'network') {
                    // Ignore network errors or try to re-init if needed, but don't hard stop UI if ephemeral
                    setIsListening(false);
                } else if (event.error === 'no-speech') {
                    // Ignore no-speech, it just means silence
                } else {
                    setIsListening(false);
                }
            }
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript("");
            recognitionRef.current.start();
            setIsListening(true);
        } else {
            alert("Speech Recognition not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return { transcript, isListening, startListening, stopListening };
}
