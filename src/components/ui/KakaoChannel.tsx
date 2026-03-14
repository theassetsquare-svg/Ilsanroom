'use client';

import { useState } from 'react';

export default function KakaoChannel() {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2">
      {/* Tooltip */}
      {showTooltip && (
        <div className="animate-fade-in relative rounded-xl bg-[#FEE500] px-4 py-2.5 shadow-lg">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-white"
          >
            ✕
          </button>
          <p className="text-xs font-medium text-neutral-900">
            카카오톡으로 문의하세요! 💬
          </p>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 bg-[#FEE500]" />
        </div>
      )}

      {/* Kakao Button */}
      <a
        href="https://pf.kakao.com/_NEON"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] shadow-lg transition-transform hover:scale-110"
        aria-label="카카오톡 채널 친구추가"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="#3C1E1E">
          <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6-.14.53-.92 3.31-.95 3.53 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.42 4.28-2.83.55.08 1.11.12 1.69.12 5.52 0 10-3.58 10-7.97C22 6.58 17.52 3 12 3z"/>
        </svg>
      </a>
    </div>
  );
}
