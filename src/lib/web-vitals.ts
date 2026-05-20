/**
 * RUM (Real User Monitoring) — web-vitals 실측 수집
 *
 * 실사용자 브라우저에서 Core Web Vitals 측정 → /api/web-vitals 로 전송 (sendBeacon).
 * Lab 점수가 아닌 실제 사용자 경험 데이터가 Google 검색 순위 기준.
 *
 * v28.0 (2026-05-20)
 */
import type { Metric } from 'web-vitals';

type WithConnection = Navigator & {
  connection?: { effectiveType?: string };
  deviceMemory?: number;
};

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobile|iPhone|iPad|Android/i.test(navigator.userAgent);
}

function report(metric: Metric): void {
  try {
    const nav = navigator as WithConnection;
    const payload = {
      metric_name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigation_type: metric.navigationType,
      page: window.location.pathname,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_memory: nav.deviceMemory ?? null,
      connection: nav.connection?.effectiveType ?? null,
      device: isMobile() ? 'mobile' : 'desktop',
    };

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/web-vitals', body);
    } else {
      // fallback
      fetch('/api/web-vitals', {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  } catch {
    /* RUM 실패가 UX 영향 주면 안 됨 — 조용히 무시 */
  }
}

export async function initWebVitals(): Promise<void> {
  // 동적 import — 메인 번들 영향 0
  const { onLCP, onCLS, onINP, onFCP, onTTFB } = await import('web-vitals');
  onLCP(report);
  onCLS(report);
  onINP(report);
  onFCP(report);
  onTTFB(report);
}
