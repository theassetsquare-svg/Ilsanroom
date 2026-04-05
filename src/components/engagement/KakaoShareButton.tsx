
/**
 * VIRAL LOOP — KakaoTalk share on every venue card
 * "[놀쿨] 매장명 — hook + 확인해보기" link
 * Format optimized for KakaoTalk preview
 */
interface KakaoShareButtonProps {
  venueName: string;
  venueHref: string;
  description?: string;
  compact?: boolean;
}

export default function KakaoShareButton({ venueName, venueHref, description, compact }: KakaoShareButtonProps) {
  const shareUrl = `https://ilsanroom.pages.dev${venueHref}`;
  const shareText = `[놀쿨] ${venueName}\n${description || '오늘 밤 여기 어때?'}\n확인해보기 👇`;

  const handleKakaoShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Try native share first (better on mobile)
    if (navigator.share) {
      navigator.share({
        title: venueName,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
      return;
    }

    // Fallback to KakaoTalk web share
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(kakaoUrl, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <button
        onClick={handleKakaoShare}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEE500] shadow-sm transition-all hover:scale-110 active:scale-95"
        aria-label="카카오톡 공유"
        style={{ minHeight: 28 }}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.96 3.56c-.08.3.26.54.52.37l4.24-2.82c.5.06 1.01.1 1.54.1 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleKakaoShare}
      className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE500] px-3 py-1.5 text-xs font-bold text-[#3C1E1E] transition-all hover:bg-[#FDD700] active:scale-[0.97]"
      style={{ minHeight: 36 }}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#3C1E1E">
        <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.96 3.56c-.08.3.26.54.52.37l4.24-2.82c.5.06 1.01.1 1.54.1 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" />
      </svg>
      여기 어때?
    </button>
  );
}
