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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);

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
