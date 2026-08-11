'use client';
import * as React from 'react';

export function ReadingProgressBar() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-[var(--site-primary)] to-purple-500 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
