'use client';

import { useState } from 'react';
import { generateShareLink } from '@/lib/utm';

interface ShareWithUTMProps {
  postId: string;
  board: string;
  title: string;
}

export default function ShareWithUTM({ postId, board, title }: ShareWithUTMProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const link = generateShareLink(postId, board, 'link');
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleKakao = () => {
    const link = generateShareLink(postId, board, 'kakao');
    // In production: use Kakao SDK
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(link)}`, '_blank');
  };

  const handleTwitter = () => {
    const link = generateShareLink(postId, board, 'twitter');
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(link)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-lg border border-neon-border px-2.5 py-1.5 text-xs text-neon-text-muted transition hover:bg-neon-surface-2 hover:text-neon-text"
      >
        {copied ? '✓ 복사됨' : '🔗 링크'}
      </button>
      <button
        onClick={handleKakao}
        className="rounded-lg bg-[#FEE500] px-2.5 py-1.5 text-xs font-medium text-[#3C1E1E] transition hover:bg-[#FDD835]"
      >
        카카오
      </button>
      <button
        onClick={handleTwitter}
        className="rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-700"
      >
        트위터
      </button>
    </div>
  );
}
