"use client";

import React, { useRef, useEffect } from "react";

interface VideoAvatarProps {
    hasStarted: boolean;
    isMuted: boolean;
}

export default function VideoAvatar({ hasStarted, isMuted }: VideoAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Initial play when interview starts
    useEffect(() => {
        if (hasStarted && videoRef.current) {
            videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
    }, [hasStarted]);

    return (
        <div className="w-full h-full bg-black rounded-xl flex items-center justify-center overflow-hidden relative">
            {!hasStarted ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-30 transition-opacity duration-1000">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        <span className="text-slate-400 text-sm font-medium animate-pulse">Initializing AI Avatar...</span>
                    </div>
                </div>
            ) : null}

            {/* Single Video Source */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                loop
               
                playsInline
                preload="auto"
            >
                <source src="/TalkingAvatar_ai.mp4" type="video/mp4" />
            </video>

            {/* Ambient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-20" />

            <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
                <div className={`w-2 h-2 rounded-full ${isMuted ? "bg-red-500" : "bg-green-500"} animate-pulse`} />
                <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">
                    AI Interviewer {isMuted ? "(Muted)" : "(Active)"}
                </span>
            </div>
        </div>
    );
}
