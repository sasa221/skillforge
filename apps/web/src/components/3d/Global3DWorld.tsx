'use client';

import * as React from 'react';
import * as THREE from 'three';

export function Global3DWorld() {
  const mountRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Dynamic Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const lightCyan = new THREE.PointLight(0x38bdf8, 4, 40);
    lightCyan.position.set(10, 10, 10);
    scene.add(lightCyan);

    const lightPurple = new THREE.PointLight(0x818cf8, 4, 40);
    lightPurple.position.set(-10, -10, 5);
    scene.add(lightPurple);

    const lightGold = new THREE.PointLight(0xfbbf24, 3, 40);
    lightGold.position.set(0, -20, -5);
    scene.add(lightGold);

    // 1. Quantum Core (Hero Section Object at Y=0)
    const coreGroup = new THREE.Group();

    const outerKnotGeo = new THREE.TorusKnotGeometry(2.2, 0.45, 150, 32);
    const outerKnotMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      wireframe: true,
    });
    const outerKnot = new THREE.Mesh(outerKnotGeo, outerKnotMat);
    coreGroup.add(outerKnot);

    const innerSphereGeo = new THREE.IcosahedronGeometry(1.1, 3);
    const innerSphereMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    coreGroup.add(innerSphere);

    coreGroup.position.set(4.5, 0, 0);
    scene.add(coreGroup);

    // 2. Mid-Page Feature Objects (Section 2 at Y=-25)
    const featureGroup = new THREE.Group();

    const cubeGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      wireframe: true,
      emissive: 0x818cf8,
      emissiveIntensity: 0.6,
    });
    const cube1 = new THREE.Mesh(cubeGeo, cubeMat);
    cube1.position.set(-5, 0, 0);
    featureGroup.add(cube1);

    const octGeo = new THREE.OctahedronGeometry(1.6);
    const octMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      wireframe: true,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.6,
    });
    const cube2 = new THREE.Mesh(octGeo, octMat);
    cube2.position.set(5, -2, 0);
    featureGroup.add(cube2);

    featureGroup.position.set(0, -25, 0);
    scene.add(featureGroup);

    // 3. Global Particle Field
    const particleCount = 500;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorCyan = new THREE.Color(0x38bdf8);
    const colorPurple = new THREE.Color(0x818cf8);
    const colorGold = new THREE.Color(0xfbbf24);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 60;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const rnd = Math.random();
      const c = rnd < 0.4 ? colorCyan : rnd < 0.8 ? colorPurple : colorGold;
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Scroll & Mouse Interaction
    let scrollY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Rotate objects
      outerKnot.rotation.x = time * 0.3;
      outerKnot.rotation.y = time * 0.4;
      innerSphere.rotation.y = -time * 0.5;

      cube1.rotation.x = time * 0.5;
      cube1.rotation.y = time * 0.3;
      cube2.rotation.y = -time * 0.6;

      particles.rotation.y = time * 0.03;

      // Scroll-driven Camera Movement
      const scrollFactor = scrollY * 0.015;
      camera.position.y = -scrollFactor + mouseY * 0.5;
      camera.position.x = mouseX * 0.5;

      // Light orbit
      lightCyan.position.x = Math.sin(time * 0.8) * 12;
      lightCyan.position.y = Math.cos(time * 0.8) * 12 - scrollFactor;

      lightPurple.position.x = -Math.sin(time * 0.6) * 12;
      lightPurple.position.y = -Math.cos(time * 0.6) * 12 - scrollFactor;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      outerKnotGeo.dispose();
      outerKnotMat.dispose();
      innerSphereGeo.dispose();
      innerSphereMat.dispose();
      cubeGeo.dispose();
      cubeMat.dispose();
      octGeo.dispose();
      octMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-80" />;
}
