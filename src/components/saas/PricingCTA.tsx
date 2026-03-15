'use client';

import { useState } from 'react';
import TossPaymentWidget from './TossPaymentWidget';

export default function PricingCTA({ planId, label, highlighted }: { planId: string; label: string; highlighted: boolean }) {
  const [showPayment, setShowPayment] = useState(false);

  const isPaid = planId !== 'free' && planId !== 'help';
  const isConsult = planId === 'help';

  if (isConsult) {
    return (
      <a href="/help"
        className="block rounded-xl px-6 py-3 text-center text-sm font-semibold border border-neutral-600 text-neon-text hover:bg-neon-surface-2 transition-colors"
        style={{ minHeight: 48 }}>
        {label}
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => isPaid ? setShowPayment(true) : (window.location.href = '/admin/onboarding')}
        className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-colors ${
          highlighted
            ? 'bg-neon-primary text-neon-text hover:bg-neon-primary-light'
            : 'border border-neutral-600 text-neon-text hover:bg-neon-surface-2'
        }`}
        style={{ minHeight: 48 }}
      >
        {label}
      </button>

      {showPayment && (
        <TossPaymentWidget planId={planId} onClose={() => setShowPayment(false)} />
      )}
    </>
  );
}
