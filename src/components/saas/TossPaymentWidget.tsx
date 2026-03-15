'use client';

import { useEffect, useRef, useState } from 'react';
import { PLAN_PRICES, PLAN_NAMES, generateOrderId } from '@/lib/payments';

interface TossPaymentWidgetProps {
  planId: string;
  onClose: () => void;
}

export default function TossPaymentWidget({ planId, onClose }: TossPaymentWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
  const amount = PLAN_PRICES[planId] || 0;
  const planName = PLAN_NAMES[planId] || planId;

  useEffect(() => {
    if (amount === 0) {
      setLoading(false);
      return;
    }

    const loadWidget = async () => {
      try {
        // Load Toss SDK
        if (!(window as any).TossPayments) {
          const script = document.createElement('script');
          script.src = 'https://js.tosspayments.com/v1/payment';
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        setLoading(false);
      } catch {
        setError('결제 모듈 로딩 실패');
        setLoading(false);
      }
    };

    loadWidget();
  }, [amount]);

  const handlePayment = async () => {
    if (!(window as any).TossPayments) {
      setError('결제 모듈이 준비되지 않았습니다');
      return;
    }

    try {
      const tossPayments = (window as any).TossPayments(clientKey);
      const orderId = generateOrderId(planId);

      await tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName: `오늘밤어디 ${planName} 플랜`,
        customerName: '업주',
        successUrl: `${window.location.origin}/admin/onboarding?payment=success&orderId=${orderId}`,
        failUrl: `${window.location.origin}/pricing?payment=fail`,
      });
    } catch (err: any) {
      if (err?.code === 'USER_CANCEL') return;
      setError(err?.message || '결제 처리 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-neon-border bg-neon-surface p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-neon-text">결제하기</h3>
          <button onClick={onClose} className="text-neon-text-muted hover:text-neon-text" style={{ minWidth: 40, minHeight: 40 }}>✕</button>
        </div>

        {/* 주문 요약 */}
        <div className="rounded-xl border border-neon-border bg-neon-bg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neon-text-muted">플랜</span>
            <span className="text-sm font-bold text-neon-text">{planName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neon-text-muted">결제 금액</span>
            <span className="text-lg font-bold text-neon-primary-light">₩{amount.toLocaleString()}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-neon-border">
            <span className="text-[10px] text-neon-text-muted/60">월 정기결제 · 토스페이먼츠 처리</span>
          </div>
        </div>

        <div ref={widgetRef} />

        {loading ? (
          <div className="py-8 text-center text-sm text-neon-text-muted animate-pulse">결제 모듈 준비 중...</div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={() => { setError(''); setLoading(true); }} className="text-xs text-neon-primary-light hover:underline">다시 시도</button>
          </div>
        ) : amount === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-neon-text-muted mb-4">무료 플랜은 결제 없이 바로 시작할 수 있습니다.</p>
            <a href="/admin/onboarding" className="inline-block rounded-xl bg-neon-primary px-6 py-3 text-sm font-semibold text-neon-text transition hover:bg-neon-primary-light" style={{ minHeight: 48 }}>
              무료로 시작하기
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              className="w-full rounded-xl bg-[#0064FF] py-3.5 text-sm font-bold text-white transition hover:bg-[#0057E0]"
              style={{ minHeight: 48 }}
            >
              토스페이먼츠로 결제하기
            </button>
            <p className="text-[10px] text-neon-text-muted/60 text-center">
              테스트 모드: test_ck_ 키 사용 중 · 실제 결제 없음
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
