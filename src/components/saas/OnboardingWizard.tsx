'use client';

import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BusinessInfo {
  name: string;
  category: string;
  address: string;
  description: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiry: string;
  cvc: string;
}

interface OnboardingWizardProps {
  onComplete?: (data: { business: BusinessInfo; plan: string; payment: PaymentInfo }) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = ['정보입력', '요금제선택', '결제', '완료'] as const;

const CATEGORIES = [
  { value: '', label: '카테고리 선택' },
  { value: 'room', label: '룸' },
  { value: 'lounge', label: '라운지' },
  { value: 'night', label: '나이트' },
  { value: 'yojeong', label: '요정' },
  { value: 'club', label: '클럽' },
  { value: 'hoppa', label: '호빠' },
  { value: 'collatek', label: '콜라텍' },
];

const PLANS = [
  {
    name: '무료',
    price: '₩0',
    period: '영구 무료',
    features: ['업소 등록 1건'],
    border: 'border-neon-border',
    btn: 'border border-neon-border bg-neon-surface-2 text-neon-text hover:bg-neon-surface-2/80',
  },
  {
    name: '베이직',
    price: '₩29,000',
    period: '/ 월',
    features: ['업소 등록', '기본 통계', '리뷰 관리'],
    border: 'border-neon-border',
    btn: 'border border-neon-border bg-neon-surface-2 text-neon-text hover:bg-neon-surface-2/80',
  },
  {
    name: '프로',
    price: '₩49,000',
    period: '/ 월',
    features: ['베이직 전체', '프리미엄 배지', '이벤트 등록', 'API 접근'],
    popular: true,
    border: 'border-neon-primary',
    btn: 'bg-gradient-to-r from-neon-primary to-neon-primary-dark text-white shadow-lg shadow-neon-primary/20 hover:from-neon-primary-light hover:to-neon-primary',
  },
  {
    name: '프리미엄',
    price: '₩99,000',
    period: '/ 월',
    features: ['프로 전체', '우선 노출', '전담 매니저', '맞춤 분석'],
    border: 'border-neon-gold',
    btn: 'border-2 border-neon-gold bg-neon-gold/10 text-neon-gold hover:bg-neon-gold/20',
  },
];

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isComplete = stepNum < current;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-neon-primary text-white shadow-lg shadow-neon-primary/30'
                    : isComplete
                      ? 'bg-neon-green/20 text-neon-green'
                      : 'bg-neon-surface-2 text-neon-text-muted'
                }`}
              >
                {isComplete ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  isActive ? 'text-neon-primary-light' : 'text-neon-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px w-12 sm:w-16 ${
                  isComplete ? 'bg-neon-green/40' : 'bg-neon-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<BusinessInfo>({
    name: '',
    category: '',
    address: '',
    description: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('프로');
  const [payment, setPayment] = useState<PaymentInfo>({
    cardNumber: '',
    expiry: '',
    cvc: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* --- Validation --- */
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!business.name.trim()) newErrors.name = '업소명을 입력해 주세요';
    if (!business.category) newErrors.category = '카테고리를 선택해 주세요';
    if (!business.address.trim()) newErrors.address = '주소를 입력해 주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (selectedPlan !== '무료') {
      if (!payment.cardNumber.trim()) newErrors.cardNumber = '카드번호를 입력해 주세요';
      if (!payment.expiry.trim()) newErrors.expiry = '유효기간을 입력해 주세요';
      if (!payment.cvc.trim()) newErrors.cvc = 'CVC를 입력해 주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* --- Navigation --- */
  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 3) {
      onComplete?.({ business, plan: selectedPlan, payment });
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
  };

  const handlePrev = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  /* --- Input helpers --- */
  const inputClass = (field: string) =>
    `w-full rounded-lg border bg-neon-surface px-4 py-2.5 text-neon-text placeholder-neon-text-muted/50 outline-none transition-colors focus:border-neon-primary ${
      errors[field] ? 'border-neon-red' : 'border-neon-border'
    }`;

  /* --- Step 1: Business Info --- */
  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="mb-6 text-center text-xl font-bold text-neon-text">업소 정보 입력</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">업소명</label>
        <input
          type="text"
          value={business.name}
          onChange={(e) => setBusiness((b) => ({ ...b, name: e.target.value }))}
          placeholder="업소명을 입력해 주세요"
          className={inputClass('name')}
        />
        {errors.name && <p className="mt-1 text-sm text-neon-red">{errors.name}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">카테고리</label>
        <select
          value={business.category}
          onChange={(e) => setBusiness((b) => ({ ...b, category: e.target.value }))}
          className={inputClass('category')}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-neon-red">{errors.category}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">주소</label>
        <input
          type="text"
          value={business.address}
          onChange={(e) => setBusiness((b) => ({ ...b, address: e.target.value }))}
          placeholder="주소를 입력해 주세요"
          className={inputClass('address')}
        />
        {errors.address && <p className="mt-1 text-sm text-neon-red">{errors.address}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">
          소개 <span className="text-neon-text-muted/50">(선택)</span>
        </label>
        <textarea
          value={business.description}
          onChange={(e) => setBusiness((b) => ({ ...b, description: e.target.value }))}
          placeholder="업소를 간단히 소개해 주세요"
          rows={3}
          className={`${inputClass('description')} resize-none`}
        />
      </div>
    </div>
  );

  /* --- Step 2: Plan Selection --- */
  const renderStep2 = () => (
    <div>
      <h2 className="mb-6 text-center text-xl font-bold text-neon-text">요금제 선택</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <button
            key={plan.name}
            type="button"
            onClick={() => setSelectedPlan(plan.name)}
            className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
              plan.border
            } ${
              selectedPlan === plan.name
                ? 'ring-2 ring-neon-primary ring-offset-2 ring-offset-neon-bg'
                : ''
            } bg-neon-surface hover:bg-neon-surface-2/50`}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-neon-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                인기
              </span>
            )}
            <div className="mb-3">
              <p className="font-bold text-neon-text">{plan.name}</p>
              <p className="mt-1">
                <span className="text-xl font-bold text-neon-text">{plan.price}</span>
                <span className="text-xs text-neon-text-muted"> {plan.period}</span>
              </p>
            </div>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-neon-text-muted">
                  <svg className="h-3 w-3 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );

  /* --- Step 3: Payment --- */
  const renderStep3 = () => (
    <div>
      <h2 className="mb-2 text-center text-xl font-bold text-neon-text">결제 정보</h2>
      <p className="mb-6 text-center text-sm text-neon-text-muted">
        선택한 요금제:{' '}
        <span className="font-semibold text-neon-primary-light">{selectedPlan}</span>
      </p>

      {selectedPlan === '무료' ? (
        <div className="rounded-xl border border-neon-border bg-neon-surface-2/30 p-6 text-center">
          <p className="text-sm text-neon-text-muted">
            무료 플랜은 결제 정보가 필요하지 않습니다
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">
              카드번호
            </label>
            <input
              type="text"
              value={payment.cardNumber}
              onChange={(e) => setPayment((p) => ({ ...p, cardNumber: e.target.value }))}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className={inputClass('cardNumber')}
            />
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-neon-red">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">
                유효기간
              </label>
              <input
                type="text"
                value={payment.expiry}
                onChange={(e) => setPayment((p) => ({ ...p, expiry: e.target.value }))}
                placeholder="MM/YY"
                maxLength={5}
                className={inputClass('expiry')}
              />
              {errors.expiry && (
                <p className="mt-1 text-sm text-neon-red">{errors.expiry}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">
                CVC
              </label>
              <input
                type="text"
                value={payment.cvc}
                onChange={(e) => setPayment((p) => ({ ...p, cvc: e.target.value }))}
                placeholder="000"
                maxLength={4}
                className={inputClass('cvc')}
              />
              {errors.cvc && <p className="mt-1 text-sm text-neon-red">{errors.cvc}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-neon-border bg-neon-surface-2/30 p-3">
            <div className="flex items-center gap-2 text-xs text-neon-text-muted">
              <svg className="h-4 w-4 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              결제 정보는 안전하게 암호화되어 처리됩니다
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* --- Step 4: Complete --- */
  const renderStep4 = () => (
    <div className="py-4 text-center">
      {/* Confetti animation */}
      <div className="relative mx-auto mb-6 h-24 w-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neon-green/10">
            <svg className="h-10 w-10 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        {/* CSS confetti particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 block h-2 w-2 rounded-full"
            style={{
              backgroundColor: ['#818cf8', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6],
              animation: `confetti-${i % 4} 1.5s ease-out ${i * 0.1}s forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <h2 className="mb-2 text-2xl font-bold text-neon-text">가입 완료!</h2>
      <p className="mb-8 text-sm text-neon-text-muted">
        <span className="font-semibold text-neon-primary-light">{selectedPlan}</span> 플랜으로
        오늘밤어디에 오신 것을 환영합니다
      </p>

      <button
        onClick={() => onComplete?.({ business, plan: selectedPlan, payment })}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon-primary to-neon-primary-dark px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-neon-primary/20 transition-all duration-200 hover:from-neon-primary-light hover:to-neon-primary"
      >
        대시보드로 이동
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      {/* Confetti keyframes */}
      <style jsx>{`
        @keyframes confetti-0 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-30px, -50px) scale(1); opacity: 0; }
        }
        @keyframes confetti-1 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(35px, -45px) scale(1); opacity: 0; }
        }
        @keyframes confetti-2 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-40px, 20px) scale(1); opacity: 0; }
        }
        @keyframes confetti-3 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(25px, 40px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      <StepIndicator current={step} />

      <div className="rounded-2xl border border-neon-border bg-neon-surface p-6 sm:p-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Navigation */}
        {step < 4 && (
          <div className="mt-8 flex justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={handlePrev}
                className="rounded-lg border border-neon-border px-6 py-2.5 text-sm font-medium text-neon-text transition-colors hover:bg-neon-surface-2"
              >
                이전
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              className="rounded-lg bg-gradient-to-r from-neon-primary to-neon-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon-primary/20 transition-all duration-200 hover:from-neon-primary-light hover:to-neon-primary"
            >
              {step === 3 ? (selectedPlan === '무료' ? '시작하기' : '결제하기') : '다음'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
