"use client";

import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

interface DIdAvatarProps {
    interviewId: string;
    onStart?: () => void;
    onStop?: () => void;
    onMessage?: (message: any) => void;
}

export default function DIdAvatar({
    interviewId,
    onStart,
    onStop,
}: DIdAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const idleVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [streamId, setStreamId] = useState<string | null>(null);

    const cleanup = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setIsConnected(false);
        setIsStreaming(false);
    };

    const startSession = async () => {
        if (loading || isConnected) return;
        setLoading(true);
        setError(null);
        try {
            cleanup();

            console.log("D-ID: Creating session for interview:", interviewId);
            // Using the alex image for the stream generation base
            const res = await api.post(`/did/session?interviewId=${interviewId}`, {
                source_url: window.location.origin + "/alex_v2_idle_image.png"
            });

            const { id: sId, session_id: sessId, offer, ice_servers: iceServers } = res.data;
            setStreamId(sId);
            setSessionId(sessId);

            const pc = new RTCPeerConnection({ iceServers });
            peerConnection.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    api.post(`/did/session/${sId}/ice`, {
                        candidate: event.candidate,
                        session_id: sessId
                    }).catch(e => console.error("ICE error", e));
                }
            };

            pc.ontrack = (event) => {
                console.log("D-ID: Received track");
                if (videoRef.current && event.track.kind === "video") {
                    videoRef.current.srcObject = event.streams[0];
                    setIsStreaming(true);
                }
            };

            pc.onconnectionstatechange = () => {
                console.log("D-ID Connection State:", pc.connectionState);
                if (pc.connectionState === "connected") {
                    setIsConnected(true);
                    onStart?.();
                } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                    cleanup();
                    onStop?.();
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await api.post(`/did/session/${sId}/sdp`, {
                answer,
                session_id: sessId
            });

        } catch (err: any) {
            console.error("D-ID: Failed to start session", err);
            setError(err.message || "Failed to initialize D-ID streaming");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        startSession();
        return () => cleanup();
    }, []);

    // Handle incoming speech commands
    useEffect(() => {
        const handleDIdSpeak = async (e: any) => {
            // Note: In Streaming API, the backend triggers the speak via session+stream IDs.
            // The frontend "did-speak" event here might not be needed if the backend already triggers it,
            // BUT usually the frontend receives the user's answer and tells the backend "trigger next question".
            // If the backend already does this in InterviewsService, we don't need a separate call here.
            // However, keeping this listener for manual overrides or "Thinking" messages.
            console.log("D-ID: Received speak event locally (ignored if backend handles it)", e.detail.text);
        };

        window.addEventListener("did-speak", handleDIdSpeak);
        window.addEventListener("heygen-speak", handleDIdSpeak);

        return () => {
            window.removeEventListener("did-speak", handleDIdSpeak);
            window.removeEventListener("heygen-speak", handleDIdSpeak);
        };
    }, [isConnected]);

    return (
        <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border-2 border-slate-700 relative">
            {/* Idle Video - Background Layer */}
            <video
                ref={idleVideoRef}
                src="/alex_v2_idle.mp4"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
            />

            {/* D-ID Stream - Foreground Layer */}
            <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isStreaming ? "opacity-100" : "opacity-0"}`}
                autoPlay
                playsInline
            />

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

            {!isConnected && !loading && !error && (
                <button
                    onClick={startSession}
                    className="absolute z-20 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Reconnect Avatar
                </button>
            )}

            <div className="absolute bottom-2 left-2 text-[8px] text-white/20 font-mono pointer-events-none z-20">
                D-ID STREAMING (TALKS/STREAMS)
            </div>
        </div>
    );
}
