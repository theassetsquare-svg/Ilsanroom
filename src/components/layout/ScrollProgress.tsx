'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress((scrollTop / docHeight) * 100);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 right-0 left-0 z-[60] h-0.5">
      <div
        className="scroll-progress h-full transition-[width] duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
