'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const dismissed = sessionStorage.getItem('newsletter_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    try {
      const supabase = createClient();
      if (supabase) {
        await (supabase as any).from('newsletter').insert({
          email: email.trim(),
          subscribed_at: new Date().toISOString(),
          source: 'popup',
        });
      }
      setStatus('success');
      localStorage.setItem('newsletter_subscribed', 'true');
      sessionStorage.setItem('newsletter_dismissed', 'true');
    } catch {
      setStatus('error');
    }
  };

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem('newsletter_dismissed', 'true');
  };

  if (!show || localStorage.getItem('newsletter_subscribed') === 'true') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={dismiss}>
      <div
        className="w-full max-w-md rounded-2xl border border-neon-primary/30 bg-neon-surface p-6 sm:p-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute top-3 right-3 text-neon-text-muted hover:text-neon-text text-lg" style={{ minWidth: 40, minHeight: 40 }}>
          ✕
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🎉</p>
            <h3 className="text-lg font-bold text-neon-text mb-2">구독 완료!</h3>
            <p className="text-sm text-neon-text-muted">최신 나이트라이프 소식을 보내드리겠습니다.</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-neon-text mb-2">뉴스레터 구독</h3>
            <p className="text-sm text-neon-text-muted mb-5">
              주간 나이트라이프 트렌드, 신규 업소, 이벤트 소식을 받아보세요.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소 입력"
                required
                className="flex-1 rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="shrink-0 rounded-xl bg-neon-primary px-5 py-3 text-sm font-semibold text-neon-text transition hover:bg-neon-primary-light disabled:opacity-50"
                style={{ minHeight: 48 }}
              >
                {status === 'loading' ? '...' : '구독'}
              </button>
            </form>
            {status === 'error' && (
              <p className="mt-2 text-xs text-red-400">오류가 발생했습니다. 다시 시도해 주세요.</p>
            )}
            <p className="mt-3 text-[10px] text-neon-text-muted/50 text-center">
              발송자: qotjsdnr123@naver.com · 언제든 구독 해지 가능
            </p>
          </>
        )}
      </div>
    </div>
  );
}
