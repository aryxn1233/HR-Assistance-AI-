"use client";

import React, { useEffect, useRef, useState } from 'react';

import { Button } from "@/components/ui/button"
import { Mic, Video, VideoOff, MicOff, PhoneOff } from "lucide-react"

export function WebcamPreview() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    useEffect(() => {
        let mounted = true;

        const initCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                if (mounted) {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                if (mounted) setError("Camera access denied or unavailable.");
            }
        };

        initCamera();

        return () => {
            mounted = false;
            // Cleanup stream tracks on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Update tracks when toggles change
    useEffect(() => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = isVideoEnabled;
            });
            stream.getAudioTracks().forEach(track => {
                track.enabled = isAudioEnabled;
            });
        }
    }, [isVideoEnabled, isAudioEnabled, stream]);

    const toggleVideo = () => setIsVideoEnabled(!isVideoEnabled);
    const toggleAudio = () => setIsAudioEnabled(!isAudioEnabled);

    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg">
            {error ? (
                <div className="flex h-full w-full items-center justify-center flex-col gap-2">
                    <VideoOff className="h-12 w-12 text-red-500" />
                    <p className="text-sm text-zinc-400">{error}</p>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted // Mute local playback to avoid feedback
                        className={`h-full w-full object-cover transform scale-x-[-1] ${!isVideoEnabled ? 'hidden' : ''}`}
                    />
                    {!isVideoEnabled && (
                        <div className="flex h-full w-full items-center justify-center absolute inset-0 bg-zinc-900">
                            <div className="h-32 w-32 rounded-full bg-zinc-800 flex items-center justify-center opacity-50">
                                <VideoOff className="h-12 w-12 text-zinc-500" />
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="absolute top-4 left-4 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white animate-pulse flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full"></div> REC
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
                <Button
                    variant={isAudioEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleAudio}
                    className="rounded-full h-10 w-10 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-0"
                >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                    variant={isVideoEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={toggleVideo}
                    className="rounded-full h-10 w-10 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-0"
                >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    )
}
