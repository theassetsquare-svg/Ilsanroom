import { useState } from 'react';
import { trackEvent } from '@/lib/visitor-tracker';

/* 카톡 원클릭 친구 초대 박스 — 입소문 가속기.
   Web Share API (모바일 카톡/메시지 자동) → 폴백 = 클립보드 복사.
   미리보기 글은 받는 주소의 og:title · og:description 그대로다(홈 = 프리렌더가 쓴 title · description). */

const INVITE_URL = 'https://nolcool.com/?utm_source=invite&utm_medium=kakao'; // [놀쿨86-1] 가입 안내 쪽(/welcome)이 아니라 홈으로 — 받은 사람이 가입 없이 바로 가게 정보를 본다
const INVITE_TEXT = '놀쿨 — 오늘 갈 곳을 같이 골라 보세요.';

export default function InviteFriendBox() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    trackEvent('share_click', { url: INVITE_URL, channel: 'home_invite_box' });
    // 1. Web Share API (모바일 = 카톡/메시지/메일 시트 열림)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: '놀쿨 — 전국의 밤을 한눈에',
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
      window.prompt('아래 링크를 복사해 대화창에 붙여 넣으세요.', `${INVITE_TEXT} ${INVITE_URL}`);
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
            <div className="text-[13px] font-black text-[#111]">함께 갈 사람에게 놀쿨을 보내 주세요</div>
            <div className="text-[11px] text-[#666] leading-snug">
              {copied ? '링크를 복사했습니다. 대화창에 붙여 넣으세요.' : '가입하지 않아도 바로 가게 정보를 볼 수 있습니다.'}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-[12px] font-black text-amber-700 group-hover:text-amber-800">
          {copied ? '복사됨' : '링크 보내기'}
        </div>
      </button>
    </section>
  );
}
