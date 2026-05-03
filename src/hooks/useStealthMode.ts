import { useEffect, useState, useCallback } from 'react';

/* Stealth 모드 — 폰 잠깐 빌려줄 때 탭 제목·favicon 위장
   가족·연인·동료가 화면 봐도 "📚 메모"로만 보임.
   localStorage 키로 새로고침해도 유지. 한 번 토글로 켜고/끄기. */

const STEALTH_KEY = 'nolcool.stealth';
const STEALTH_TITLE = '📚 메모';
const STEALTH_FAVICON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="50" font-size="50">📚</text></svg>';

let originalFavicon: string | null = null;

function applyStealth(on: boolean) {
  const root = document.documentElement;
  if (on) {
    root.setAttribute('data-stealth', 'on');
    document.title = STEALTH_TITLE;
    // favicon 백업 후 위장
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (link) {
      if (originalFavicon === null) originalFavicon = link.href;
      link.href = STEALTH_FAVICON;
    }
  } else {
    root.removeAttribute('data-stealth');
    // 원래 favicon 복구
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (link && originalFavicon) link.href = originalFavicon;
    // title은 다음 useDocumentMeta가 알아서 복구. 일단 임시:
    document.title = '놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다';
  }
}

export function useStealthMode() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STEALTH_KEY) === '1';
      setOn(saved);
      applyStealth(saved);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setOn(prev => {
      const next = !prev;
      try { localStorage.setItem(STEALTH_KEY, next ? '1' : '0'); } catch {}
      applyStealth(next);
      return next;
    });
  }, []);

  return { on, toggle };
}
