/**
 * Share button — 네이티브 공유 or 클립보드 복사
 */
interface KakaoShareButtonProps {
  venueName: string;
  venueHref: string;
  description?: string;
  compact?: boolean;
}

export default function KakaoShareButton({ venueName, venueHref, description, compact }: KakaoShareButtonProps) {
  const shareUrl = `https://nolcool.com${venueHref}`;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      navigator.share({ title: venueName, text: description || venueName, url: shareUrl }).catch(() => {});
      return;
    }

    navigator.clipboard.writeText(shareUrl).catch(() => {});
  };

  if (compact) {
    return (
      <button
        onClick={handleShare}
        className="flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: '#8B5CF6', minHeight: 36 }}
        aria-label="공유"
      >
        <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-[0.97]"
      style={{ backgroundColor: '#8B5CF6', minHeight: 36 }}
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
      공유
    </button>
  );
}
