import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// 배포 직후 stale index.html(SWR 캐시)이 퍼지된 옛 청크 해시를 참조해 동적 import 가 404 나는 경우,
// 1회만 새로고침해 최신 청크를 받는다. 무한 루프 방지 위해 세션당 1회로 가드.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('nc-reloaded-once')) return;
  sessionStorage.setItem('nc-reloaded-once', '1');
  window.location.reload();
});

// [놀쿨12-2 · 느림(16-2 CWV)] 프리렌더 첫 화면(ssr-hero · 첫 그림은 HTML 안)이 한 번 그려진 다음에 React 를 붙인다.
//   예전에는 React 가 첫 그리기 전에 #root 를 갈아끼워 프리렌더 첫 화면이 한 번도 안 그려지고, 가장 큰 요소(LCP)가 자바스크립트를 다 받은 뒤로 밀렸다(모바일 5~12초).
//   web.dev/articles/optimize-lcp 「요소 렌더 지연 줄이기」 · web.dev/articles/rendering-on-the-web(서버 DOM 을 바로 부수는 실수).
const mount = () => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
// 브라우저가 프리렌더 첫 화면의 가장 큰 요소(LCP 후보)를 기록한 다음에 붙인다 — 기록 전에 갈아끼우면 그 후보가 버려진다(실측 · Lighthouse 추적).
//   LCP 관찰기를 못 쓰는 브라우저·기록이 늦으면 1.5초 뒤 그냥 붙인다.
if (document.querySelector('#root > .ssr-hero')) {
  let done = false;
  const go = () => { if (done) return; done = true; requestAnimationFrame(() => mount()); };
  try {
    const po = new PerformanceObserver((l) => { if (l.getEntries().length) { po.disconnect(); go(); } });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { requestAnimationFrame(() => requestAnimationFrame(go)); }
  setTimeout(go, 1500);
} else mount();

// RUM — 실사용자 Core Web Vitals 수집 (v28.0)
// 메인 번들·FCP 영향 0 위해 idle 시점에 동적 import
const initRum = () => {
  import('./lib/web-vitals').then((m) => m.initWebVitals()).catch(() => {});
};
if ('requestIdleCallback' in window) {
  (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(initRum);
} else {
  setTimeout(initRum, 2000);
}
