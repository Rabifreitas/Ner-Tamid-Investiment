import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

const EternalFlame = ({ intensity = 1 }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();

        // Pulse intensity based on market activity (simulated by the prop)
        const pulse = 1 + Math.sin(t * 2) * 0.1 * intensity;
        meshRef.current.scale.set(pulse, pulse, pulse);
    });

    return (
        <group>
            {/* Core Light */}
            <pointLight intensity={2 * intensity} distance={10} color="#ffcc33" />

            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <Sphere ref={meshRef} args={[1, 64, 64]}>
                    <MeshDistortMaterial
                        color="#ffaa00"
                        emissive="#ff4400"
                        emissiveIntensity={2 * intensity}
                        speed={3}
                        distort={0.4}
                        radius={1}
                    />
                </Sphere>
            </Float>

            {/* Subliminal Glow Layer */}
            <Sphere args={[1.2, 32, 32]}>
                <MeshWobbleMaterial
                    color="#ffcc33"
                    transparent
                    opacity={0.1 * intensity}
                    factor={0.5}
                    speed={2}
                />
            </Sphere>
        </group>
    );
};

export const NerTamidVisualizer: React.FC<{ activityLevel?: number }> = ({ activityLevel = 1 }) => {
    return (
        <div style={{ width: '100%', height: '400px', background: 'radial-gradient(circle, #1a1a1a 0%, #0a0a0a 100%)' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <EternalFlame intensity={activityLevel} />
            </Canvas>
        </div>
    );
};
