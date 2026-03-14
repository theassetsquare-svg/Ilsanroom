// Sentry error monitoring integration

const SENTRY_DSN = process.env.SENTRY_DSN || '';

interface SentryEvent {
  message: string;
  level: 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  timestamp: string;
}

// Initialize Sentry (lightweight client-side implementation)
export function initSentry() {
  if (!SENTRY_DSN || typeof window === 'undefined') return;

  // Global error handler
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      source: event.filename || 'unknown',
      line: event.lineno,
      col: event.colno,
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    captureError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledrejection' }
    );
  });

  console.log('[Sentry] Initialized');
}

// Capture error
export function captureError(error: Error, extra?: Record<string, unknown>) {
  const event: SentryEvent = {
    message: error.message,
    level: 'error',
    tags: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    },
    extra: {
      stack: error.stack,
      ...extra,
    },
    timestamp: new Date().toISOString(),
  };

  // In production: send to Sentry API
  if (SENTRY_DSN) {
    fetch('/api/v1/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {});
  }

  // Always log to console in development
  console.error('[Sentry]', event.message, extra);
}

// Capture message
export function captureMessage(message: string, level: 'warning' | 'info' = 'info') {
  if (!SENTRY_DSN) return;

  const event: SentryEvent = {
    message,
    level,
    timestamp: new Date().toISOString(),
  };

  fetch('/api/v1/error-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => {});
}

// Set user context
export function setUser(userId: string, email?: string) {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__sentry_user = { id: userId, email };
  }
}
