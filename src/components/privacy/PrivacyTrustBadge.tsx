import { Link } from '../ui/SafeLink';

/* 홈 상단 개인정보 보호 안내 띠 — 지금 실제로 동작하는 기능 이름만 적는다. 누르면 /privacy-promise 안내 쪽으로. */

export default function PrivacyTrustBadge() {
  return (
    <Link
      to="/privacy-promise"
      className="block group"
    >
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-violet-50 px-4 py-3 hover:border-emerald-200 hover:shadow-sm transition">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white text-lg shadow-sm">
            🔒
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">닉네임 활동</span>
              <span className="text-[10px] text-emerald-700">·</span>
              <span className="text-[11px] font-bold text-violet-700">탭 제목 가리기</span>
              <span className="text-[10px] text-violet-700">·</span>
              <span className="text-[11px] font-bold text-rose-700">시크릿 모드 안내</span>
            </div>
            <p className="text-[12px] text-[#444] leading-snug">
              놀쿨이 개인정보를 다루는 방법 <span className="text-emerald-700 font-bold group-hover:underline">→ 자세히 보기</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
