'use client';

import * as React from 'react';
import * as THREE from 'three';

type Ai3DOrbProps = {
  state?: 'idle' | 'thinking' | 'speaking' | 'success';
  className?: string;
  size?: number;
};

export function Ai3DOrb({ state = 'idle', className = '', size = 160 }: Ai3DOrbProps) {
  const mountRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Color states
    const colorMap = {
      idle: 0x38bdf8, // Cyan
      thinking: 0xa855f7, // Purple
      speaking: 0xf59e0b, // Amber Gold
      success: 0x10b981, // Emerald Green
    };

    const targetColor = new THREE.Color(colorMap[state] ?? colorMap.idle);

    // Inner Glowing Sphere
    const sphereGeo = new THREE.IcosahedronGeometry(0.85, 3);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: targetColor,
      emissive: targetColor,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      wireframe: false,
    });
    const orbMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(orbMesh);

    // Outer Wireframe Shield
    const outerGeo = new THREE.IcosahedronGeometry(1.05, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: targetColor,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);

    // Light
    const pLight = new THREE.PointLight(targetColor, 3, 10);
    pLight.position.set(2, 2, 2);
    scene.add(pLight);

    const aLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(aLight);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // State-specific motion dynamics
      if (state === 'thinking') {
        orbMesh.rotation.y = time * 2.5;
        orbMesh.rotation.x = time * 1.8;
        outerMesh.rotation.z = -time * 3.0;
        sphereMat.emissiveIntensity = 0.8 + Math.sin(time * 8) * 0.3;
      } else if (state === 'speaking') {
        orbMesh.rotation.y = time * 1.2;
        outerMesh.rotation.y = -time * 1.5;
        const scale = 1 + Math.sin(time * 10) * 0.06;
        orbMesh.scale.set(scale, scale, scale);
        sphereMat.emissiveIntensity = 0.7 + Math.sin(time * 6) * 0.25;
      } else {
        orbMesh.rotation.y = time * 0.5;
        outerMesh.rotation.y = -time * 0.3;
        orbMesh.scale.set(1, 1, 1);
        sphereMat.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.15;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sphereGeo.dispose();
      sphereMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      renderer.dispose();
    };
  }, [state, size]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
