'use client';

import { useEffect, useState } from 'react';

function getRandomCount() {
  return Math.floor(Math.random() * (389 - 127 + 1)) + 127;
}

function getDelta() {
  return Math.floor(Math.random() * 21) - 10; // -10 to +10
}

export default function LiveVisitors() {
  // Disabled: no real visitor tracking yet
  return null;
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(getRandomCount());

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev === null) return getRandomCount();
        const next = prev + getDelta();
        // Clamp within range
        return Math.max(127, Math.min(389, next));
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (count === null) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="glass flex items-center gap-2 rounded-full border border-neon-border px-3 py-1.5 text-xs text-neon-text-muted">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-green opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green" />
        </span>
        <span>
          현재 <span className="font-medium text-neon-text">{count}</span>명 접속 중
        </span>
      </div>
    </div>
  );
}
