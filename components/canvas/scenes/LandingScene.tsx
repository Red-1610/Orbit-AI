'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function generateSpherePoints(count = 1500, radius = 2) {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    points[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    points[i * 3 + 2] = r * Math.cos(phi);
  }
  return points;
}

const pointsData = generateSpherePoints();

export default function LandingScene() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.x -= delta * 0.05;
    pointsRef.current.rotation.y -= delta * 0.08;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={pointsRef} positions={pointsData} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#fb3232"
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}