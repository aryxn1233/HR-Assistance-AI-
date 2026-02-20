"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
    isSpeaking: boolean;
    modelUrl?: string;
}

function AvatarModel({ isSpeaking, modelUrl = "/avatar.glb" }: AvatarProps) {
    // Fallback if model not found, we show a placeholder sphere? 
    // actually useGLTF might suspend. handle error boundary in parent if needed.
    // For now, let's assume valid GLB or handle error gracefully.

    const group = useRef<THREE.Group>(null);
    const { scene } = useGLTF(modelUrl, true); // true = start loading

    // Clone scene to avoid mutation issues if reused
    const clone = React.useMemo(() => scene.clone(), [scene]);

    useFrame((state, delta) => {
        if (!group.current) return;

        // Idle Animation: Breathing
        const t = state.clock.getElapsedTime();
        group.current.position.y = -1.6 + Math.sin(t * 1) * 0.02; // breathe up/down
        group.current.rotation.y = Math.sin(t * 0.5) * 0.05; // slight turn

        // Speaking Animation: Head nod / Jaw bounce
        if (isSpeaking) {
            group.current.rotation.x = Math.sin(t * 15) * 0.05; // fast nod
            // jaw animation would require accessing specific bone or morph target.
            // simplified: just nod for now.
        } else {
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
        }
    });

    return <primitive object={clone} ref={group} scale={1.5} position={[0, -1.6, 0]} />;
}

function FallbackAvatar({ isSpeaking }: { isSpeaking: boolean }) {
    const mesh = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (mesh.current && isSpeaking) {
            mesh.current.scale.y = 1 + Math.sin(state.clock.getElapsedTime() * 10) * 0.1;
        }
    });
    return (
        <mesh ref={mesh} position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={isSpeaking ? "hotpink" : "orange"} />
        </mesh>
    )
}

export default function SafeAvatar({ isSpeaking }: { isSpeaking: boolean }) {
    const [hasError, setHasError] = useState(false);

    return (
        <div className="w-full h-full min-h-[400px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden relative">
            {/* Zoomed in for interview headshot feel */}
            <Canvas camera={{ position: [0, 0.2, 0.8], fov: 45, near: 0.1, far: 10 }}>
                <ambientLight intensity={0.8} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <directionalLight position={[0, 5, 5]} intensity={1.5} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <React.Suspense fallback={null}>
                    <ErrorBoundary setHasError={setHasError}>
                        {!hasError ? <AvatarModel isSpeaking={isSpeaking} /> : <FallbackAvatar isSpeaking={isSpeaking} />}
                    </ErrorBoundary>
                    <Environment preset="city" />
                </React.Suspense>

                <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2} />
            </Canvas>
            {hasError && <div className="absolute top-2 right-2 text-xs text-red-400 bg-black/50 px-2 rounded">Avatar model missing (check public/avatar.glb)</div>}
        </div>
    );
}

class ErrorBoundary extends React.Component<{ setHasError: (v: boolean) => void, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.log("Avatar load error:", error);
        this.props.setHasError(true);
    }
    render() {
        if (this.state.hasError) {
            return this.props.children; // Renders Fallback implicitly via parent logic or could render fallback here
        }
        return this.props.children;
    }
}
