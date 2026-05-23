import { useEffect, useState } from 'react';
import { Link } from '../ui/SafeLink';

/* 첫 방문 시크릿 모드 권장 토스트 — 1회 노출 후 영구 dismiss
   유흥 사용자가 가족·연인 폰에 흔적 안 남기는 방법 안내.
   강요 X, 안내만. 닫기/링크 클릭 또는 8초 자동 fade out.
   z=60: StickyPhoneBar(80) 아래에 깔려서 CTA 우선.
   data-secret-toast: StickyPhoneBar 있는 페이지에서 CSS 자동 숨김. */

const SEEN_KEY = 'nolcool.secret_toast_seen';

export default function SecretModeToast() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) === '1') return;
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    } catch {}
  }, []);

  useEffect(() => {
    if (!show) return;
    /* 8초 후 자동 페이드 → dismiss */
    const fadeTimer = setTimeout(() => setFading(true), 8000);
    const closeTimer = setTimeout(() => {
      try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
      setShow(false);
    }, 9000);
    return () => { clearTimeout(fadeTimer); clearTimeout(closeTimer); };
  }, [show]);

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      data-secret-toast="true"
      className={`fixed left-1/2 -translate-x-1/2 z-[60] w-[calc(100vw-24px)] max-w-md transition-opacity duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 shadow-lg">
        <span className="text-base shrink-0">🧹</span>
        <p className="text-[12px] text-[#333] leading-tight flex-1 min-w-0 truncate">
          <strong className="text-emerald-700">시크릿 모드</strong>로 켜면 흔적 0%
        </p>
        <Link
          to="/privacy-promise"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition"
        >
          자세히
        </Link>
        <button
          onClick={dismiss}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-[#888] hover:bg-gray-100 transition"
          aria-label="닫기"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
