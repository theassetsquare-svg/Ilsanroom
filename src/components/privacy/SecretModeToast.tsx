import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/* 첫 방문 시크릿 모드 권장 토스트 — 1회 노출 후 영구 dismiss
   유흥 사용자가 가족·연인 폰에 흔적 안 남기는 방법 안내.
   강요 X, 안내만. 닫기 또는 5초 자동 닫힘. */

const SEEN_KEY = 'nolcool.secret_toast_seen';

function detectIncognito(): boolean {
  // 시크릿 모드는 정확히 감지 어려움 — 휴리스틱만.
  // navigator.storage.estimate() — 시크릿이면 quota 매우 작음
  // 하지만 false positive 많아 그냥 토스트는 항상 노출.
  return false;
}

export default function SecretModeToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) === '1') return;
      if (detectIncognito()) {
        // 이미 시크릿이면 안내 불필요
        localStorage.setItem(SEEN_KEY, '1');
        return;
      }
      // 2초 후 노출 (LCP 안전)
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    } catch {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-24px)] max-w-md md:bottom-6 animate-slide-in-bottom">
      <div className="rounded-2xl border border-emerald-200 bg-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-violet-50 px-4 py-2.5 flex items-center justify-between border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <span className="text-base">🧹</span>
            <span className="text-[13px] font-black text-[#111]">흔적 0% 팁</span>
          </div>
          <button
            onClick={dismiss}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#999] hover:bg-white hover:text-[#555] transition"
            aria-label="닫기"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-3">
          <p className="text-[13px] text-[#444] leading-relaxed mb-2.5">
            가족·연인이 폰 봐도 흔적 안 남게 <strong className="text-emerald-600">시크릿 모드</strong>로 즐기는 거 추천.<br />
            <span className="text-[11px] text-[#777]">크롬: ⋮ → "새 시크릿 창" / 사파리: 탭 → 비공개</span>
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/privacy-promise"
              onClick={dismiss}
              className="flex-1 text-center rounded-xl bg-emerald-500 px-3 py-2 text-[12px] font-bold text-white hover:bg-emerald-600 transition"
            >
              프라이버시 6대 약속 →
            </Link>
            <button
              onClick={dismiss}
              className="rounded-xl border border-[#E5E5EA] px-3 py-2 text-[12px] font-bold text-[#555] hover:bg-gray-50 transition"
            >
              알았어
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
