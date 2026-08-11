'use client';

import * as React from 'react';
import * as THREE from 'three';

export function Trophy3D({ level = 1, size = 120 }: { level?: number; size?: number }) {
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

    const trophyGroup = new THREE.Group();

    // Metallic Base
    const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.3, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.8;
    trophyGroup.add(baseMesh);

    // Metallic Stem
    const stemGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.5, 32);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      roughness: 0.15,
      metalness: 0.95,
    });
    const stemMesh = new THREE.Mesh(stemGeo, goldMat);
    stemMesh.position.y = -0.4;
    trophyGroup.add(stemMesh);

    // Cup Body
    const cupGeo = new THREE.CylinderGeometry(0.75, 0.3, 0.9, 32, 1, true);
    const cupMesh = new THREE.Mesh(cupGeo, goldMat);
    cupMesh.position.y = 0.25;
    trophyGroup.add(cupMesh);

    // Inner Gem
    const gemGeo = new THREE.OctahedronGeometry(0.35);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.05,
      metalness: 0.9,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.y = 0.35;
    trophyGroup.add(gemMesh);

    scene.add(trophyGroup);

    // Light setup
    const light1 = new THREE.PointLight(0xfbbf24, 3, 10);
    light1.position.set(2, 3, 2);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x38bdf8, 2, 10);
    light2.position.set(-2, -1, 2);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      trophyGroup.rotation.y = time * 0.8;
      gemMesh.rotation.y = -time * 1.5;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      baseGeo.dispose();
      baseMat.dispose();
      stemGeo.dispose();
      goldMat.dispose();
      cupGeo.dispose();
      gemGeo.dispose();
      gemMat.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <div className="relative inline-flex items-center gap-3 rounded-[1.8rem] border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent p-3 pr-6 shadow-[0_15px_35px_rgba(56,189,248,0.15)] backdrop-blur-xl">
      <div ref={mountRef} style={{ width: size, height: size }} className="relative flex-shrink-0" />
      <div>
        <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-cyan-400">Mastery Rank</div>
        <div className="mt-1 text-2xl font-extrabold text-white">Level {level} Scholar 🏆</div>
        <div className="mt-0.5 text-xs text-cyan-200/80">Earn XP by completing quizzes & lessons!</div>
      </div>
    </div>
  );
}
