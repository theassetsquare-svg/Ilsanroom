'use client';

import { useState, useEffect } from 'react';
import { venues } from '@/data/venues';

const openVenues = venues.filter((v) => v.status !== 'closed_or_unclear');

function getRandomVenue() {
  return openVenues[Math.floor(Math.random() * openVenues.length)];
}

function getRandomMinutes() {
  return Math.floor(Math.random() * 8) + 1;
}

function getRandomCount() {
  return Math.floor(Math.random() * 5) + 2;
}

export default function SocialProofToast() {
  // Disabled: no real data yet. Enable when real analytics available.
  return null;
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const showToast = () => {
      const v = getRandomVenue();
      const count = getRandomCount();
      const mins = getRandomMinutes();
      setMessage(`${mins}분 전 ${count}명이 ${v.nameKo} 조회`);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };

    const initial = setTimeout(showToast, 8000);
    const interval = setInterval(showToast, 25000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 z-30 animate-fade-in md:bottom-6">
      <div className="flex items-center gap-2 rounded-xl border border-neon-border bg-neon-surface/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <span className="flex h-2 w-2 shrink-0 rounded-full bg-neon-green">
          <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-neon-green opacity-75" />
        </span>
        <p className="text-xs text-neon-text-muted">{message}</p>
      </div>
    </div>
  );
}
