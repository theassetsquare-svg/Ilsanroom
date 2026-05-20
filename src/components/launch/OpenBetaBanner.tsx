import { Link } from '../ui/SafeLink';
import { useFoundingMember } from '@/hooks/useFoundingMember';

/* OPEN BETA 시그널 배너 — 런칭 직후 첫 100명 한정 분위기.
   "지금 막 열렸음" 긴박감 + 창립멤버 명예욕 트리거.
   첫 방문자가 5초 안에 "여기 들어가야 한다" 느끼게. */

export default function OpenBetaBanner() {
  const { remaining, loading } = useFoundingMember(null);
  const showRemaining = !loading && remaining !== null && remaining > 0;

  return (
    <section className="px-4 pt-3 pb-1 max-w-3xl mx-auto">
      <Link
        to="/welcome"
        className="block group"
      >
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-rose-50 to-violet-50 px-4 py-3">
          {/* 점멸 라이브 닷 */}
          <div className="flex items-center gap-3">
            <div className="shrink-0 relative">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping opacity-60" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">OPEN BETA</span>
                <span className="text-[10px] text-rose-700">·</span>
                <span className="text-[11px] font-bold text-amber-800">놀쿨 방금 오픈</span>
              </div>
              <p className="text-[13px] text-[#222] leading-snug">
                {showRemaining ? (
                  <>
                    창립멤버 <strong className="text-rose-600">{remaining}자리</strong> 남음 ·{' '}
                    <span className="text-violet-700 font-bold group-hover:underline">⭐ 1~100번 영구 뱃지 →</span>
                  </>
                ) : (
                  <>
                    창립멤버 첫 100명 <strong className="text-rose-600">⭐ 영구 뱃지</strong> ·{' '}
                    <span className="text-violet-700 font-bold group-hover:underline">지금 가입 →</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
