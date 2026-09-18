'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface DashboardSceneProps {
  isThinking?: boolean;
}

export default function DashboardScene({ isThinking = false }: DashboardSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Accelerate rotation when the AI is executing tools or reasoning
    meshRef.current.rotation.y += delta * (isThinking ? 1.6 : 0.35);
    meshRef.current.rotation.x += delta * (isThinking ? 0.9 : 0.15);
  });

  return (
    <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.2}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.4}>
        <MeshDistortMaterial
          color={isThinking ? '#f59e0b' : '#3b82f6'} // Amber when thinking, Blue when idle
          distort={isThinking ? 0.55 : 0.25}
          speed={isThinking ? 3.5 : 1}
          roughness={0.2}
          metalness={0.7}
        />
      </Sphere>
    </Float>
  );
}