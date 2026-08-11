'use client';

import * as React from 'react';

type Card3DTiltProps = {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees
  glareOpacity?: number;
};

export function Card3DTilt({
  children,
  className = '',
  maxTilt = 12,
  glareOpacity = 0.25,
}: Card3DTiltProps) {
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);
  const [glarePos, setGlarePos] = React.useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const px = mouseX / width;
      const py = mouseY / height;

      const tiltY = (px - 0.5) * maxTilt * 2;
      const tiltX = (0.5 - py) * maxTilt * 2;

      setRotateX(tiltX);
      setRotateY(tiltY);
      setGlarePos({ x: px * 100, y: py * 100, opacity: glareOpacity });
    },
    [maxTilt, glareOpacity],
  );

  const handleMouseLeave = React.useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      className={`relative transition-transform duration-200 ease-out ${className}`}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
          transition: rotateX === 0 ? 'transform 0.5s ease-out' : 'none',
        }}
        className="relative h-full w-full rounded-[inherit]"
      >
        {children}

        {/* Specular Glare Layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)`,
          }}
        />
      </div>
    </div>
  );
}
