import { useState } from 'react';

/* 카톡 원클릭 친구 초대 박스 — 입소문 가속기.
   Web Share API (모바일 카톡/메시지 자동) → 폴백 = 클립보드 복사.
   카톡 미리보기는 og:* 가 항상 중립 ("놀쿨 — 오늘 밤 가이드"). */

const INVITE_URL = 'https://nolcool.com/welcome';
const INVITE_TEXT = '놀쿨 — 오늘 밤 가이드. 카톡 공유해도 업소 단어 0%, 친구한테 추천해도 안전.';

export default function InviteFriendBox() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    // 1. Web Share API (모바일 = 카톡/메시지/메일 시트 열림)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: '놀쿨 — 오늘 밤 가이드',
          text: INVITE_TEXT,
          url: INVITE_URL,
        });
        return;
      } catch {
        // 사용자 취소 또는 미지원 — 폴백
      }
    }
    // 2. 클립보드 복사 폴백
    try {
      await navigator.clipboard.writeText(`${INVITE_TEXT} ${INVITE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // prompt 폴백
      window.prompt('아래 링크를 카톡에 붙여넣으세요:', `${INVITE_TEXT} ${INVITE_URL}`);
    }
  };

  return (
    <section className="px-4 py-3 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={share}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 px-4 py-3.5 hover:border-yellow-300 transition group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-lg shadow-sm">
            💬
          </div>
          <div className="text-left min-w-0">
            <div className="text-[13px] font-black text-[#111]">친구한테 카톡으로 보내기</div>
            <div className="text-[11px] text-[#666] truncate">
              {copied ? '✓ 링크 복사 완료 — 카톡에 붙여넣기' : '미리보기에 업소 단어 0% · 안전'}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-[12px] font-black text-amber-700 group-hover:text-amber-800">
          {copied ? '복사됨' : '보내기 →'}
        </div>
      </button>
    </section>
  );
}
