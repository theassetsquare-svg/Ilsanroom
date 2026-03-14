'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : '';

  const handleKakao = () => {
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleInsta = async () => {
    try { await navigator.clipboard.writeText(`${title}\n${shareUrl}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className="flex justify-center gap-3">
      <button onClick={handleKakao} className="rounded-lg bg-[#FEE500] px-4 py-2 text-xs font-medium text-neutral-900 transition hover:bg-[#FDD700]">카카오</button>
      <button onClick={handleInsta} className="rounded-lg bg-neon-pink/20 px-4 py-2 text-xs font-medium text-neon-pink transition hover:bg-neon-pink/30">인스타</button>
      <button onClick={handleCopy} className="rounded-lg bg-neon-surface-2 px-4 py-2 text-xs font-medium text-neon-text-muted transition hover:bg-neon-border">
        {copied ? '복사됨!' : 'URL 복사'}
      </button>
    </div>
  );
}
