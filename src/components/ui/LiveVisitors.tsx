import { useState, useEffect } from 'react';

export default function LiveVisitors() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const getBaseCount = () => {
      const hour = new Date().getHours();
      if (hour >= 21 || hour < 2) return 180 + Math.floor(Math.random() * 60);
      if (hour >= 18 && hour < 21) return 120 + Math.floor(Math.random() * 40);
      if (hour >= 14 && hour < 18) return 60 + Math.floor(Math.random() * 30);
      if (hour >= 12 && hour < 14) return 40 + Math.floor(Math.random() * 20);
      return 15 + Math.floor(Math.random() * 15);
    };

    setCount(getBaseCount());

    const interval = setInterval(() => {
      setCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(10, prev + delta);
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (!count) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-neon-text-muted">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-green opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green" />
      </span>
      <span>지금 <strong className="text-neon-text">{count}</strong>명 접속 중</span>
    </div>
  );
}
