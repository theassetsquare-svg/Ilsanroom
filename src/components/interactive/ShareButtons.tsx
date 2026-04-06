import { useState } from 'react';

interface ShareButtonsProps {
  title: string;
  url?: string;
  description?: string;
}

export default function ShareButtons({ title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : '';
  const shareText = `${title}\n${description || ''}\n${shareUrl}`;

  // 카카오톡 — 모바일: 네이티브 공유에서 카카오 선택 / PC: URL 복사
  const handleKakao = () => {
    if (navigator.share) {
      navigator.share({ title, text: `${title}\n`, url: shareUrl }).catch(() => {});
    } else {
      // PC: 클립보드 복사 후 안내
      navigator.clipboard.writeText(`${title}\n${shareUrl}`).then(() => {
        alert('링크가 복사되었습니다! 카카오톡에 붙여넣기 해주세요.');
      }).catch(() => {});
    }
  };

  // Web Share API (모바일 네이티브 공유 시트)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description || title, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex justify-center gap-2">
      {/* 카카오톡 */}
      <button
        onClick={handleKakao}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEE500] px-4 py-2.5 text-xs font-bold text-[#3C1E1E] transition hover:bg-[#FDD700] active:scale-[0.97]"
        style={{ minHeight: 44 }}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.96 3.56c-.08.3.26.54.52.37l4.24-2.82c.5.06 1.01.1 1.54.1 5.52 0 10-3.58 10-7.94S17.52 3 12 3z"/></svg>
        오늘 밤 여기 어때?
      </button>
      {/* 공유하기 (네이티브 or 복사) */}
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B5CF6] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#7C3AED] active:scale-[0.97]"
        style={{ minHeight: 44 }}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        {copied ? '복사됨!' : '공유하기'}
      </button>
    </div>
  );
}
