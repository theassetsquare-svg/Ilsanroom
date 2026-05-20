import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

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
