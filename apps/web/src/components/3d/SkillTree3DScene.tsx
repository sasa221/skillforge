'use client';

import * as React from 'react';
import * as THREE from 'three';

const skills = [
  { name: 'JavaScript Core', pos: [-3.5, 1.5, 0], color: 0xfbbf24 },
  { name: 'React & Next.js', pos: [0, 2.2, 1], color: 0x38bdf8 },
  { name: 'NestJS Backend', pos: [3.5, 1.5, 0], color: 0x34d399 },
  { name: 'PostgreSQL & Prisma', pos: [-2, -1.8, 0.5], color: 0xa855f7 },
  { name: 'AI Engineering', pos: [2, -1.8, 0.5], color: 0xf43f5e },
];

export function SkillTree3DScene() {
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const [activeSkill, setActiveSkill] = React.useState<string | null>('React & Next.js');

  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Node Meshes & Connecting Beams
    const nodesGroup = new THREE.Group();
    const nodeMeshes: THREE.Mesh[] = [];

    skills.forEach((skill) => {
      const geo = new THREE.IcosahedronGeometry(0.55, 2);
      const mat = new THREE.MeshPhysicalMaterial({
        color: skill.color,
        emissive: skill.color,
        emissiveIntensity: 0.7,
        roughness: 0.1,
        metalness: 0.85,
        clearcoat: 1.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(skill.pos[0], skill.pos[1], skill.pos[2]);
      mesh.userData = { name: skill.name };
      nodesGroup.add(mesh);
      nodeMeshes.push(mesh);
    });

    // Connecting Beams (Lines)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
    for (let i = 0; i < skills.length - 1; i++) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...skills[i].pos),
        new THREE.Vector3(...skills[i + 1].pos),
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      nodesGroup.add(line);
    }

    scene.add(nodesGroup);

    // Ambient Lights
    const pLight = new THREE.PointLight(0xffffff, 2.5, 30);
    pLight.position.set(5, 5, 5);
    scene.add(pLight);

    const aLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(aLight);

    // Raycaster for Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const name = intersects[0].object.userData.name;
        if (name) setActiveSkill(name);
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    };

    container.addEventListener('mousemove', handleMouseMove);

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
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      nodesGroup.rotation.y = Math.sin(time * 0.2) * 0.3;
      nodesGroup.rotation.x = Math.cos(time * 0.2) * 0.15;

      nodeMeshes.forEach((m, idx) => {
        m.rotation.y = time * 0.8;
        m.position.y = skills[idx].pos[1] + Math.sin(time * 2 + idx) * 0.08;
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      nodeMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      lineMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[2.2rem] border border-indigo-500/30 bg-gradient-to-b from-[#0b1120] to-[#070b14] p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-cyan-400">Interactive 3D Skill Tree</div>
          <div className="text-2xl font-extrabold text-white">Orbit & Explore Skill Nodes</div>
        </div>
        {activeSkill ? (
          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-300">
            Selected: {activeSkill}
          </div>
        ) : null}
      </div>

      <div ref={mountRef} className="relative h-[380px] w-full" />
    </div>
  );
}
