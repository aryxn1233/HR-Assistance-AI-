"use client";

import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

interface DIdAvatarProps {
    interviewId: string;
    onStart?: () => void;
    onStop?: () => void;
    onStatusChange?: (isSpeaking: boolean) => void;
    onMessage?: (message: any) => void;
}

export default function DIdAvatar({
    interviewId,
    onStart,
    onStop,
    onStatusChange,
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

    const isCleaningUp = useRef(false);
    const iceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const cleanup = async () => {
        if (isCleaningUp.current) return;
        isCleaningUp.current = true;

        if (iceTimerRef.current) {
            clearTimeout(iceTimerRef.current);
            iceTimerRef.current = null;
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (statsIntervalId.current) {
            clearInterval(statsIntervalId.current);
            statsIntervalId.current = null;
        }

        // IMPORTANT: Close the session on the D-ID server to free up concurrent stream slots
        if (streamId && sessionId) {
            try {
                await api.delete(`/did/session/${streamId}`, {
                    data: { session_id: sessionId },
                    params: { interviewId }
                });
                console.log("D-ID: Session successfully closed on server");
            } catch (e) {
                console.warn("D-ID: Failed to close session on server (might be already closed)", e);
            }
        }

        setStreamId(null);
        setSessionId(null);
        setIsConnected(false);
        setIsStreaming(false);
        isCleaningUp.current = false;
    };

    const statsIntervalId = useRef<any>(null);
    const lastBytesReceived = useRef<number>(0);

    const onVideoStatusChange = (playing: boolean, stream: MediaStream) => {
        setIsStreaming(playing);
        onStatusChange?.(playing);
        if (playing && videoRef.current && videoRef.current.srcObject !== stream) {
            console.log("D-ID: Setting video srcObject (first time or changed)");
            videoRef.current.srcObject = stream;
        }
    };

    const startSession = async () => {
        if (loading || isConnected) return;
        setLoading(true);
        setError(null);
        try {
            await cleanup();

            const res = await api.post(`/did/session?interviewId=${interviewId}`, {
                source_url: "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg"
            });

            const { id: sId, session_id: sessId, offer, ice_servers: iceServers } = res.data;
            setStreamId(sId);
            setSessionId(sessId);

            const pc = new RTCPeerConnection({ iceServers });
            peerConnection.current = pc;

            const dc = pc.createDataChannel("JanusDataChannel");
            dc.onmessage = (e) => {
                console.log("D-ID DataChannel Message:", e.data);
                if (e.data.includes("stream/started")) {
                    setIsStreaming(true);
                    onStatusChange?.(true);
                } else if (e.data.includes("stream/done")) {
                    setIsStreaming(false);
                    onStatusChange?.(false);
                }
            };

            const iceCandidatesBuffer: (RTCIceCandidate | null)[] = [];

            pc.onicecandidate = (event) => {
                if (!isCleaningUp.current && pc.connectionState !== 'closed') {
                    // Send candidates as they come or the null candidate to signal end of gathering
                    const cand = event.candidate;
                    iceCandidatesBuffer.push(cand);

                    if (!iceTimerRef.current) {
                        iceTimerRef.current = setTimeout(() => {
                            if (iceCandidatesBuffer.length > 0 && !isCleaningUp.current && pc.connectionState !== 'closed') {
                                const candidatesToSend = [...iceCandidatesBuffer];
                                iceCandidatesBuffer.length = 0;

                                candidatesToSend.forEach((c, index) => {
                                    setTimeout(() => {
                                        if (!isCleaningUp.current && pc.connectionState !== 'closed') {
                                            api.post(`/did/session/${sId}/ice`, {
                                                candidate: c,
                                                session_id: sessId
                                            }).catch(e => {
                                                if (e.response?.status !== 429 && !isCleaningUp.current) {
                                                    console.error("ICE error", e);
                                                }
                                            });
                                        }
                                    }, index * 100);
                                });
                            }
                            iceTimerRef.current = null;
                        }, 500);
                    }
                }
            };

            pc.ontrack = (event) => {
                console.log("D-ID: Received track");
                if (event.track.kind === "video") {
                    statsIntervalId.current = setInterval(async () => {
                        if (!pc || pc.signalingState === 'closed' || isCleaningUp.current) return;
                        try {
                            const stats = await pc.getStats(event.track);
                            stats.forEach((report) => {
                                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                                    const isMoving = report.bytesReceived > lastBytesReceived.current;
                                    onVideoStatusChange(isMoving, event.streams[0]);
                                    lastBytesReceived.current = report.bytesReceived;
                                }
                            });
                        } catch (e) {
                            // Stats can fail if PC closed in between
                        }
                    }, 500);
                }
            };

            pc.onconnectionstatechange = () => {
                console.log("D-ID Connection State:", pc.connectionState);
                if (pc.connectionState === "connected") {
                    setIsConnected(true);
                    // Trigger initial question or re-trigger speech once connected
                    api.post(`/interviews/${interviewId}/respeak`).catch(e => {
                        console.warn("Failed to trigger initial speech", e);
                    });
                    onStart?.();
                } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                    if (!isCleaningUp.current) {
                        cleanup();
                        onStop?.();
                    }
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
        // startSession(); // REMOVED: Manual connection only
        return () => {
            cleanup().catch(console.error);
        };
    }, []);

    // Handle incoming speech commands
    useEffect(() => {
        const handleDIdSpeak = async (e: any) => {
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
        <div className="w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden relative border-4 border-white/5 shadow-[0_0_60px_rgba(37,99,235,0.1)] mx-auto">
            {/* Connection Placeholder (Icon/Orb) */}
            {!isConnected && !loading && !error && (
                <div className="flex flex-col items-center gap-6 z-30">
                    <div className="w-32 h-32 bg-blue-600/20 rounded-full flex items-center justify-center border-2 border-blue-500/50 relative">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" />
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={startSession}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border-b-4 border-blue-800"
                    >
                        Connect AI Interviewer
                    </button>
                    <p className="text-xs text-blue-400 font-medium tracking-wide">Standard WebRTC Stream Connection</p>
                </div>
            )}

            {/* Idle Video - Background Layer (Visible when connected and NOT streaming) */}
            {isConnected && (
                <video
                    ref={idleVideoRef}
                    src="/emma_idle.mp4"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isStreaming ? "opacity-0" : "opacity-100"}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            )}

            {/* D-ID Stream - Foreground Layer (Visible when connected and streaming) */}
            {isConnected && (
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isStreaming ? "opacity-100" : "opacity-0"}`}
                    autoPlay
                    playsInline
                />
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 text-white">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-base font-bold tracking-tight">Initializing Session</span>
                            <span className="text-[10px] text-blue-400 font-mono uppercase tracking-[0.2em]">Negotiating WebRTC...</span>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 z-50 backdrop-blur-md border-2 border-red-500/30 text-center p-8">
                    <div className="max-w-xs">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-red-400 font-bold mb-2">Connection Failure</p>
                        <p className="text-red-200/70 text-xs mb-6 leading-relaxed">{error}</p>
                        <button
                            onClick={startSession}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-6 rounded-lg transition-transform hover:scale-105"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-white/20 font-mono pointer-events-none z-20 tracking-widest uppercase bg-black/20 px-2 rounded">
                D-ID LIVE STREAM
            </div>
        </div>
    );
}
