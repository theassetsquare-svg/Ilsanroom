'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export default function ShareButton({
  title = '오늘밤어디',
  text = '이 업소 정보를 확인해 보세요!',
  url,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
    setShowDropdown(false);
  };

  const handleKakao = () => {
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(kakaoUrl, '_blank', 'noopener,noreferrer');
    setShowDropdown(false);
  };

  const handleInstagram = () => {
    // Instagram doesn't have a direct share URL — copy link instead
    handleCopy();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // cancelled
      }
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neon-border px-3 py-2 text-sm text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? '복사됨!' : '공유'}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 z-50 w-40 rounded-xl glass-strong p-2 animate-scale-in">
          <button onClick={handleKakao} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neon-text-muted hover:bg-neon-surface-2 hover:text-neon-text transition-colors">
            <span className="text-yellow-400">K</span> 카카오
          </button>
          <button onClick={handleInstagram} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neon-text-muted hover:bg-neon-surface-2 hover:text-neon-text transition-colors">
            <span className="text-neon-pink">I</span> 인스타 (링크복사)
          </button>
          <button onClick={handleCopy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neon-text-muted hover:bg-neon-surface-2 hover:text-neon-text transition-colors">
            <span className="text-neon-accent">U</span> URL 복사
          </button>
        </div>
      )}
    </div>
  );
}
