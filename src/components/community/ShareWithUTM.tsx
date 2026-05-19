

import { useState } from 'react';
import { generateShareLink } from '@/lib/utm';

interface ShareWithUTMProps {
  postId: string;
  board: string;
  title: string;
}

/* 사람 톤 친구 메시지 인트로 — 결정적 회전 (제목 길이 % N) */
const FRIEND_INTROS = [
  '이거 봐봐',
  '너 이거 봤어?',
  '같이 가볼래?',
  '오 이런 글 있던데',
  '이거 우리 얘기 아냐?',
  '이거 진짜 공감됨 ㅋㅋ',
];

function buildFriendMessage(title: string, link: string): string {
  const intro = FRIEND_INTROS[title.length % FRIEND_INTROS.length];
  return `${intro} — ${title}\n${link}`;
}

export default function ShareWithUTM({ postId, board, title }: ShareWithUTMProps) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

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

  /* 친구한테 보내기 — Web Share API → fallback: 사람 톤 메시지 클립보드 */
  const handleFriendShare = async () => {
    const link = generateShareLink(postId, board, 'link');
    const message = buildFriendMessage(title, link);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text: message, url: link });
        setSent(true);
        setTimeout(() => setSent(false), 2000);
        return;
      } catch {
        /* user cancelled or unsupported — fallback */
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } catch {
      /* clipboard 실패 */
    }
  };

  const handleKakao = () => {
    const link = generateShareLink(postId, board, 'kakao');
    // In production: use Kakao SDK
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(link)}`, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const link = generateShareLink(postId, board, 'twitter');
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(link)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleFriendShare}
        className="inline-flex items-center gap-1 rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#7C3AED]"
      >
        {sent ? '✓ 보냈음' : '👋 친구한테'}
      </button>
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
        className="rounded-lg bg-neon-surface-2 px-2.5 py-1.5 text-xs text-neon-text-muted transition hover:bg-neon-surface"
      >
        트위터
      </button>
    </div>
  );
}
