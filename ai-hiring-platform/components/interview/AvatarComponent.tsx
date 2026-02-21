"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Clone, Gltf } from "@react-three/drei";

/**
 * Diagnostic Model Component:
 * Uses <Clone> for better scene graph stability.
 * Adds a persistent bounding box helper to track the avatar's location.
 */
function Model() {
    const group = useRef<any>(null);

    useFrame((state) => {
        if (group.current) {
            // Very subtle idle motion
            group.current.position.y = -1.5 + Math.sin(state.clock.getElapsedTime()) * 0.005;
        }
    });

    return (
        <group ref={group}>
            {/* Using Gltf component which is even more robust than primitive/Clone for simple cases */}
            <Gltf
                src="/avatar.glb"
                position={[0, -1.5, 0]}
                scale={[1.5, 1.5, 1.5]}
            />

            {/* Visual indicator of the model's pivot point */}
            <mesh position={[0, -1.5, 0]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color="white" />
            </mesh>
        </group>
    );
}

export default function AvatarComponent() {
    return (
        <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden border-2 border-purple-500 relative">
            <Suspense fallback={<div className="text-white text-xs p-4 animate-pulse">Loading Avatar Asset...</div>}>
                <Canvas
                    shadows={false}
                    gl={{ antialias: false, alpha: false }}
                    camera={{ position: [0, 0, 3], fov: 50 }}
                >
                    <color attach="background" args={['#0f172a']} />
                    <ambientLight intensity={1.5} />
                    <pointLight position={[5, 5, 5]} intensity={2} />

                    {/* Diagnostic Helpers */}
                    <gridHelper args={[10, 10]} position={[0, -1.6, 0]} />

                    <mesh position={[-1, 1, -1]}>
                        <boxGeometry args={[0.2, 0.2, 0.2]} />
                        <meshBasicMaterial color="orange" />
                    </mesh>

                    <Model />
                </Canvas>
            </Suspense>
            <div className="absolute top-2 right-2 text-[8px] text-white/30 font-mono">STABILITY-TEST-V6</div>
        </div>
    );
}
