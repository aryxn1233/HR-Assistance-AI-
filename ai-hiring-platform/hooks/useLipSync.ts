"use client";

import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { audioAnalyserService } from "@/lib/AudioAnalyserService";

/**
 * useLipSync
 * Maps real-time audio amplitude to avatar morph targets.
 */
export function useLipSync(
    meshRef: React.MutableRefObject<THREE.Mesh | null>,
    morphTargetName: string = "mouthOpen",
    lerpFactor: number = 0.2
) {
    const previousAmplitude = useRef(0);

    useFrame(() => {
        if (!meshRef.current || !meshRef.current.morphTargetInfluences) return;

        const morphIndex = meshRef.current.morphTargetDictionary?.[morphTargetName];
        if (morphIndex === undefined) return;

        let targetAmplitude = 0;
        if (audioAnalyserService.isPlaying()) {
            const rawAmplitude = audioAnalyserService.getAmplitude();
            // Noise gate: only move if amplitude is above threshold
            if (rawAmplitude > 0.05) {
                targetAmplitude = rawAmplitude * 3.0; // Increased multiplier for clearer speech
            }
        }

        // Apply smoothing - precise response
        const smoothedAmplitude = THREE.MathUtils.lerp(
            previousAmplitude.current,
            targetAmplitude,
            0.35
        );

        // Update morph target with natural-looking bounds
        meshRef.current.morphTargetInfluences[morphIndex] = THREE.MathUtils.clamp(smoothedAmplitude, 0, 0.85);

        previousAmplitude.current = smoothedAmplitude;
    });

    const setMouthOpen = useCallback((value: number) => {
        if (!meshRef.current || !meshRef.current.morphTargetInfluences) return;
        const morphIndex = meshRef.current.morphTargetDictionary?.[morphTargetName];
        if (morphIndex !== undefined) {
            meshRef.current.morphTargetInfluences[morphIndex] = value;
        }
    }, [meshRef, morphTargetName]);

    return { setMouthOpen };
}
