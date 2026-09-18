'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, ReactNode } from 'react';

interface ViewportProps {
  children: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
}

export default function Viewport({
  children,
  className = 'w-full h-full',
  cameraPosition = [0, 0, 5],
}: ViewportProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: cameraPosition, fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}