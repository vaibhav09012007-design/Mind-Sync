'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={2.5}>
        <MeshDistortMaterial
          color="#8B5CF6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} color="#3B82F6" intensity={0.5} />
      <pointLight position={[10, -10, 5]} color="#EC4899" intensity={0.3} />
      <AnimatedSphere />
    </>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 opacity-60">
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
