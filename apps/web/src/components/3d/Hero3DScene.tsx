'use client';

import * as React from 'react';
import * as THREE from 'three';

export function Hero3DScene() {
  const mountRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f2fe, 3, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7928ca, 3, 50);
    pointLight2.position.set(-5, -5, 2);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xff0080, 2.5, 50);
    pointLight3.position.set(0, 5, -3);
    scene.add(pointLight3);

    // Core Mesh 1: Torus Knot Wireframe
    const geometryKnot = new THREE.TorusKnotGeometry(1.3, 0.38, 128, 32);
    const materialKnot = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.4,
    });
    const torusKnot = new THREE.Mesh(geometryKnot, materialKnot);
    scene.add(torusKnot);

    // Core Mesh 2: Inner Glowing Icosahedron
    const geometryCore = new THREE.IcosahedronGeometry(0.7, 2);
    const materialCore = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: false,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
    });
    const coreMesh = new THREE.Mesh(geometryCore, materialCore);
    scene.add(coreMesh);

    // Outer Orbiting Rings
    const ringGeometry = new THREE.TorusGeometry(2.3, 0.02, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.5 }));
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // Particles Starfield
    const particlesCount = 180;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 12;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (event.clientX - windowHalfX) / windowHalfX;
      mouseY = (event.clientY - windowHalfY) / windowHalfY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate meshes
      torusKnot.rotation.x = elapsedTime * 0.25;
      torusKnot.rotation.y = elapsedTime * 0.35;

      coreMesh.rotation.x = -elapsedTime * 0.4;
      coreMesh.rotation.y = -elapsedTime * 0.3;

      ring1.rotation.z = elapsedTime * 0.2;
      ring2.rotation.z = -elapsedTime * 0.15;

      particlesMesh.rotation.y = -elapsedTime * 0.05;

      // Smooth mouse follow
      targetX = mouseX * 0.8;
      targetY = mouseY * 0.8;

      scene.rotation.y += 0.05 * (targetX - scene.rotation.y);
      scene.rotation.x += 0.05 * (targetY - scene.rotation.x);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometryKnot.dispose();
      materialKnot.dispose();
      geometryCore.dispose();
      materialCore.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
