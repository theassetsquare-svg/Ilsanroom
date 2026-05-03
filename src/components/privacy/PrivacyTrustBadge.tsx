import { Link } from 'react-router-dom';

/* 홈 상단 프라이버시 신뢰 뱃지 — 백만 회원이 친구 추천할 때 안심 포인트
   카톡 공유 위장 + 본명 X + 신상털림 차단 핵심 3가지 강조.
   클릭 시 /privacy-promise 6대 약속 페이지로. */

export default function PrivacyTrustBadge() {
  return (
    <Link
      to="/privacy-promise"
      className="block group"
      aria-label="프라이버시 6대 약속 보기"
    >
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-violet-50 px-4 py-3 hover:border-emerald-200 hover:shadow-sm transition">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white text-lg shadow-sm">
            🔒
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">100% 익명</span>
              <span className="text-[10px] text-emerald-500">·</span>
              <span className="text-[11px] font-bold text-violet-600">카톡 안전</span>
              <span className="text-[10px] text-violet-400">·</span>
              <span className="text-[11px] font-bold text-rose-600">본명 X</span>
            </div>
            <p className="text-[12px] text-[#444] leading-snug">
              친구한테 추천해도 걱정 없는 이유 <span className="text-emerald-600 font-bold group-hover:underline">→ 6대 약속</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
