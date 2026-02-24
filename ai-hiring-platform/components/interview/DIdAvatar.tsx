"use client";

import React, { useEffect, useRef, useState } from "react";
import * as did from "@d-id/client-sdk";
import api from "@/lib/api";

interface DIdAvatarProps {
    onStart?: () => void;
    onStop?: () => void;
    onMessage?: (message: any) => void;
}

export default function DIdAvatar({
    onStart,
    onStop,
    onMessage,
}: DIdAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [agentManager, setAgentManager] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const startSession = async () => {
        if (loading || isConnected) return;
        setLoading(true);
        setError(null);
        try {
            console.log("D-ID: Fetching client key...");
            const res = await api.post("/did/client-key");
            const { client_key: clientKey } = res.data;

            if (!clientKey) {
                throw new Error("No client key received from backend");
            }

            const agentId = process.env.NEXT_PUBLIC_DID_AGENT_ID;
            if (!agentId) {
                throw new Error("NEXT_PUBLIC_DID_AGENT_ID is not configured");
            }

            console.log("D-ID: Initializing Agent Manager...");
            const manager = await did.createAgentManager(agentId, {
                auth: { type: "key", clientKey },
                callbacks: {
                    onSrcObjectReady(stream) {
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            videoRef.current.play().catch(e => console.error("Video play failed", e));
                        }
                    },
                    onConnectionStateChange(state) {
                        console.log("D-ID Connection State:", state);
                        if (state === "connected") {
                            setIsConnected(true);
                            onStart?.();
                        } else if (state === "disconnected" || state === "closed") {
                            setIsConnected(false);
                            onStop?.();
                        }
                    },
                    onNewMessage(messages, type) {
                        console.log("D-ID New Message:", messages, type);
                        onMessage?.({ messages, type });
                    },
                    onError(err) {
                        console.error("D-ID SDK Error:", err);
                        setError("SDK Error: " + err.message);
                    }
                }
            });

            setAgentManager(manager);
            await manager.connect();

        } catch (err: any) {
            console.error("D-ID: Failed to start session", err);
            setError(err.message || "Failed to initialize D-ID avatar");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        startSession();
        return () => {
            if (agentManager) {
                agentManager.disconnect();
            }
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (agentManager) {
                console.log("D-ID: Cleaning up session");
                agentManager.disconnect();
            }
        };
    }, [agentManager]);

    // Handle incoming speech commands via window events (similar to HeyGen implementation)
    useEffect(() => {
        const handleDIdSpeak = async (e: any) => {
            if (agentManager && isConnected && e.detail?.text) {
                console.log("D-ID: Speaking", e.detail.text);
                try {
                    await agentManager.chat(e.detail.text);
                } catch (err) {
                    console.error("D-ID: Chat command failed", err);
                }
            } else if (!isConnected) {
                console.warn("D-ID: Cannot speak, session not connected");
            }
        };

        window.addEventListener("did-speak", handleDIdSpeak);
        // Also support the old 'heygen-speak' for backward compatibility if needed, 
        // or just update all calls to 'did-speak'.
        window.addEventListener("heygen-speak", handleDIdSpeak);

        return () => {
            window.removeEventListener("did-speak", handleDIdSpeak);
            window.removeEventListener("heygen-speak", handleDIdSpeak);
        };
    }, [agentManager, isConnected]);

    return (
        <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border-2 border-slate-700 relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-sm">Connecting to AI Interviewer...</span>
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

            {!isConnected && !loading && !error && (
                <button
                    onClick={startSession}
                    className="absolute bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Connect Avatar
                </button>
            )}

            <div className="absolute bottom-2 left-2 text-[8px] text-white/20 font-mono pointer-events-none">
                D-ID AGENT SESSIONS SDK
            </div>
        </div>
    );
}
