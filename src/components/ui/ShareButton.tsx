

import { useState } from 'react';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

/* 사람 톤 친구 인트로 — 페이지 URL 길이 % N으로 결정적 회전 */
const FRIEND_INTROS = [
  '이거 봐봐',
  '너 이거 봤어?',
  '같이 가볼래?',
  '오 이런 글 있던데',
  '이거 우리 얘기 아냐?',
  '이거 진짜 공감됨 ㅋㅋ',
];

function pickFriendIntro(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return FRIEND_INTROS[Math.abs(hash) % FRIEND_INTROS.length];
}

export default function ShareButton({
  title = '',
  text,
  url,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : '';
  /* text 미지정 시 사람 톤 인트로 + 제목 */
  const shareText = text ?? `${pickFriendIntro(shareUrl)}${title ? ` — ${title}` : ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
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
        await navigator.share({ title, text: shareText, url: shareUrl });
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
        <div data-share-popup="true" className="absolute right-0 top-full mt-2 z-50 w-40 rounded-xl glass-strong p-2 animate-scale-in">
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
