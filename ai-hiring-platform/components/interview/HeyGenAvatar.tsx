"use client";

import React, { useEffect, useRef, useState } from "react";
import StreamingAvatar, {
    AvatarQuality,
    VoiceEmotion,
    TaskMode,
} from "@heygen/streaming-avatar";
import api from "@/lib/api";

interface HeyGenAvatarProps {
    avatarId?: string;
    voiceId?: string;
    onStart?: () => void;
    onStop?: () => void;
    onSpeechEnd?: () => void;
}

export default function HeyGenAvatar({
    avatarId = "josh_lite3_20230714", // Updated to popular public ID
    voiceId = "en-US-Guy-Standard",
    onStart,
    onStop,
    onSpeechEnd,
}: HeyGenAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionData, setSessionData] = useState<any>(null);

    // Initialize Avatar Streaming
    const startSession = async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            console.log("HeyGen: Fetching token...");
            // 1. Get token from our backend
            const tokenRes = await api.post("/heygen/token");
            const token = tokenRes.data.token;

            if (!token) {
                throw new Error("No token received from backend");
            }
            console.log("HeyGen: Token received", token.substring(0, 10) + "...");

            // 2. Initialize HeyGen SDK
            const avatarInstance = new StreamingAvatar({ token });
            setAvatar(avatarInstance);

            // 3. Setup event listeners
            avatarInstance.on("stream_ready", (e) => {
                console.log("HeyGen: Stream ready", e.detail);
                setStream(e.detail);
                onStart?.();
            });

            avatarInstance.on("stream_disconnected", () => {
                console.log("HeyGen: Stream disconnected");
                setStream(null);
                setSessionData(null);
                onStop?.();
            });

            // 4. Create Session
            console.log("HeyGen: Starting avatar session with", avatarId);
            const res = await avatarInstance.createStartAvatar({
                avatarName: avatarId,
                quality: AvatarQuality.Low, // Start with Low for better stability
                voice: {
                    voiceId: voiceId,
                },
            });

            setSessionData(res);
            console.log("HeyGen: Session established", res);

        } catch (err: any) {
            console.error("HeyGen: Failed to start session", err);
            setError(err.message || "Failed to initialize HeyGen avatar");
        } finally {
            setLoading(false);
        }
    };

    // Auto-start session for now
    useEffect(() => {
        startSession();
        return () => {
            avatar?.stopAvatar();
        };
    }, []);

    // Effect to attach stream to video element
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(e => console.error("Video play failed", e));
            };
        }
    }, [stream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (avatar) {
                console.log("HeyGen: Cleaning up session");
                avatar.stopAvatar();
            }
        };
    }, [avatar]);

    // Handle incoming speech commands
    useEffect(() => {
        const handleHeyGenSpeak = async (e: any) => {
            if (avatar && sessionData && e.detail?.text) {
                console.log("HeyGen: Speaking", e.detail.text);
                try {
                    await avatar.speak({
                        text: e.detail.text,
                        taskMode: TaskMode.ASYNC,
                    });
                } catch (err) {
                    console.error("HeyGen: Speak command failed", err);
                }
            } else if (!sessionData) {
                console.warn("HeyGen: Cannot speak, session not ready");
            }
        };

        window.addEventListener("heygen-speak", handleHeyGenSpeak);
        return () => window.removeEventListener("heygen-speak", handleHeyGenSpeak);
    }, [avatar, sessionData]);

    return (
        <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border-2 border-slate-700 relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-sm">Connecting to Interviewer...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/40 z-10 border-2 border-red-500 rounded-xl text-center p-4">
                    <div>
                        <p className="text-red-400 font-bold mb-2">Connection Error</p>
                        <p className="text-red-300 text-xs mb-4">{error}</p>
                        <button
                            onClick={startSession}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
            />

            {!stream && !loading && !error && (
                <button
                    onClick={startSession}
                    className="absolute bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Reconnect Avatar
                </button>
            )}

            <div className="absolute bottom-2 left-2 text-[8px] text-white/20 font-mono pointer-events-none">
                HEYGEN STREAMING V2
            </div>
        </div>
    );
}
