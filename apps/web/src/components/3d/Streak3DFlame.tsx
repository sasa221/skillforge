'use client';

import * as React from 'react';
import * as THREE from 'three';

export function Streak3DFlame({ streakDays = 1, size = 120 }: { streakDays?: number; size?: number }) {
  const mountRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3D Flame Octahedron Core
    const flameGeo = new THREE.OctahedronGeometry(0.85, 2);
    const flameMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xef4444,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
      wireframe: false,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.scale.set(0.85, 1.25, 0.85);
    scene.add(flameMesh);

    // Outer Wireframe Energy Shield
    const outerGeo = new THREE.IcosahedronGeometry(1.1, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);

    // Lighting
    const pointLight = new THREE.PointLight(0xf59e0b, 3, 10);
    pointLight.position.set(0, 1, 2);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Pulsing flame effect
      flameMesh.rotation.y = time * 1.5;
      outerMesh.rotation.y = -time * 1.0;
      outerMesh.rotation.z = time * 0.5;

      const scaleY = 1.25 + Math.sin(time * 6) * 0.08;
      flameMesh.scale.set(0.85, scaleY, 0.85);

      flameMat.emissiveIntensity = 0.7 + Math.sin(time * 8) * 0.3;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      flameGeo.dispose();
      flameMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <div className="relative inline-flex items-center gap-3 rounded-[1.8rem] border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-3 pr-6 shadow-[0_15px_35px_rgba(245,158,11,0.15)] backdrop-blur-xl">
      <div ref={mountRef} style={{ width: size, height: size }} className="relative flex-shrink-0" />
      <div>
        <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400">Streak Active</div>
        <div className="mt-1 text-2xl font-extrabold text-white">{streakDays} Day Streak 🔥</div>
        <div className="mt-0.5 text-xs text-amber-200/80">Keep learning daily to grow your score!</div>
      </div>
    </div>
  );
}
