'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';

type CancelReason = '비용' | '기능부족' | '사용안함' | '기타';

interface ChurnModalProps {
  open: boolean;
  onClose: () => void;
  onCancel: (reason: CancelReason) => void;
}

const REASONS: { value: CancelReason; label: string }[] = [
  { value: '비용', label: '비용이 부담됩니다' },
  { value: '기능부족', label: '필요한 기능이 없습니다' },
  { value: '사용안함', label: '더 이상 사용하지 않습니다' },
  { value: '기타', label: '기타 사유' },
];

const LOST_BENEFITS = [
  '프리미엄 배지 및 우선 노출',
  '고급 통계 및 맞춤 분석',
  '축적된 리뷰 관리 데이터',
  '이벤트 등록 및 API 접근',
];

export default function ChurnModal({ open, onClose, onCancel }: ChurnModalProps) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState<CancelReason | null>(null);

  const handleClose = () => {
    setStep(1);
    setReason(null);
    onClose();
  };

  const handleFinalCancel = () => {
    if (reason) {
      onCancel(reason);
    }
    handleClose();
  };

  const renderStep1 = () => (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-red/10">
          <svg className="h-8 w-8 text-neon-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-neon-text">정말 떠나시나요?</h3>
        <p className="mt-2 text-sm text-neon-text-muted">
          해지 사유를 알려주시면 더 나은 서비스를 만드는 데 도움이 됩니다
        </p>
      </div>

      <div className="space-y-3">
        {REASONS.map((r) => (
          <label
            key={r.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
              reason === r.value
                ? 'border-neon-primary bg-neon-primary/5'
                : 'border-neon-border hover:border-neon-primary/40 hover:bg-neon-surface-2/50'
            }`}
          >
            <input
              type="radio"
              name="cancel-reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="h-4 w-4 accent-neon-primary"
            />
            <span className="text-sm text-neon-text">{r.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleClose}
          className="flex-1 rounded-lg border border-neon-border px-4 py-2.5 text-sm font-medium text-neon-text transition-colors hover:bg-neon-surface-2"
        >
          돌아가기
        </button>
        <button
          onClick={() => setStep(2)}
          disabled={!reason}
          className="flex-1 rounded-lg bg-neon-surface-2 px-4 py-2.5 text-sm font-medium text-neon-text transition-colors hover:bg-neon-surface-2/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-gold/10">
          <svg className="h-8 w-8 text-neon-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-neon-text">특별 할인을 드립니다</h3>
        <p className="mt-2 text-sm text-neon-text-muted">
          떠나시기 전에 특별 혜택을 확인해 보세요
        </p>
      </div>

      <div className="space-y-3">
        {/* 30% Discount Offer */}
        <button
          onClick={handleClose}
          className="w-full rounded-xl border-2 border-neon-gold/40 bg-neon-gold/5 p-4 text-left transition-all duration-200 hover:border-neon-gold hover:bg-neon-gold/10"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-gold/20 text-lg font-bold text-neon-gold">
              %
            </span>
            <div>
              <p className="font-semibold text-neon-text">30% 할인 (3개월간)</p>
              <p className="mt-0.5 text-xs text-neon-text-muted">
                지금 유지하시면 3개월간 30% 할인된 요금을 적용해 드립니다
              </p>
            </div>
          </div>
        </button>

        {/* Pause Option */}
        <button
          onClick={handleClose}
          className="w-full rounded-xl border border-neon-border bg-neon-surface p-4 text-left transition-all duration-200 hover:border-neon-primary/40 hover:bg-neon-surface-2/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-primary/10 text-neon-primary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-neon-text">1개월 일시정지</p>
              <p className="mt-0.5 text-xs text-neon-text-muted">
                1개월간 구독을 일시정지하고 데이터를 유지합니다
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-6">
        <button
          onClick={() => setStep(3)}
          className="w-full rounded-lg border border-neon-border px-4 py-2.5 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
        >
          혜택 없이 계속 해지하기
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-red/10">
          <svg className="h-8 w-8 text-neon-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-neon-text">최종 확인</h3>
        <p className="mt-2 text-sm text-neon-text-muted">
          해지 시 다음 혜택을 잃게 됩니다
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-neon-red/20 bg-neon-red/5 p-4">
        <ul className="space-y-2.5">
          {LOST_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-neon-text">
              <svg
                className="h-4 w-4 shrink-0 text-neon-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-3 rounded-xl border border-neon-border bg-neon-surface-2/50 p-3">
        <p className="text-xs text-neon-text-muted">
          해지 사유: <span className="font-medium text-neon-text">{reason}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleClose}
          className="flex-1 rounded-lg bg-gradient-to-r from-neon-primary to-neon-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon-primary/20 transition-all duration-200 hover:from-neon-primary-light hover:to-neon-primary"
        >
          유지하기
        </button>
        <button
          onClick={handleFinalCancel}
          className="flex-1 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-2.5 text-sm font-semibold text-neon-red transition-colors hover:bg-neon-red/20"
        >
          해지하기
        </button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose}>
      {/* Step Indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                s === step
                  ? 'bg-neon-primary text-white'
                  : s < step
                    ? 'bg-neon-green/20 text-neon-green'
                    : 'bg-neon-surface-2 text-neon-text-muted'
              }`}
            >
              {s < step ? (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`h-px w-8 transition-colors duration-300 ${
                  s < step ? 'bg-neon-green/40' : 'bg-neon-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </Modal>
  );
}
