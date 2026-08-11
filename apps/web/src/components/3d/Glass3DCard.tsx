'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Glass3DCardProps = {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: 'cyan' | 'purple' | 'amber' | 'emerald';
};

export function Glass3DCard({
  children,
  className = '',
  maxTilt = 15,
  glowColor = 'cyan',
}: Glass3DCardProps) {
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [rotX, setRotX] = React.useState(0);
  const [rotY, setRotY] = React.useState(0);
  const [glare, setGlare] = React.useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const px = x / rect.width;
      const py = y / rect.height;

      const tiltY = (px - 0.5) * maxTilt * 2;
      const tiltX = (0.5 - py) * maxTilt * 2;

      setRotX(tiltX);
      setRotY(tiltY);
      setGlare({ x: px * 100, y: py * 100, opacity: 0.3 });
    },
    [maxTilt],
  );

  const handleMouseLeave = React.useCallback(() => {
    setRotX(0);
    setRotY(0);
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  const glowBorders = {
    cyan: 'hover:border-cyan-500/40 hover:shadow-[0_20px_50px_rgba(56,189,248,0.2)]',
    purple: 'hover:border-indigo-500/40 hover:shadow-[0_20px_50px_rgba(129,140,248,0.2)]',
    amber: 'hover:border-amber-500/40 hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)]',
    emerald: 'hover:border-emerald-500/40 hover:shadow-[0_20px_50px_rgba(52,211,153,0.2)]',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 group relative w-full rounded-[2rem]"
    >
      <div
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`,
          transition: rotX === 0 ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
        className={cn(
          'transform-style-3d relative overflow-hidden rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 backdrop-blur-xl transition-all duration-300',
          glowBorders[glowColor],
          className,
        )}
      >
        {/* Specular Light Reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 65%)`,
          }}
        />

        {/* Floating 3D Children Container */}
        <div className="transform-style-3d relative z-10">{children}</div>
      </div>
    </div>
  );
}

// 3D Spatial Z-Axis Floating Layer Wrapper
export function Glass3DLayer({
  children,
  depth = 20,
  className = '',
}: {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  return (
    <div
      style={{ transform: `translateZ(${depth}px)` }}
      className={cn('transition-transform duration-300 ease-out', className)}
    >
      {children}
    </div>
  );
}
