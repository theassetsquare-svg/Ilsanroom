'use client';

import { useState } from 'react';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: Record<string, boolean>;
  cta: string;
  highlighted: boolean;
  popular: boolean;
  borderClass: string;
}

const FEATURES = [
  '업소 등록',
  '기본 통계',
  '리뷰 관리',
  '프리미엄 배지',
  '이벤트 등록',
  'API 접근',
  '우선 노출',
  '전담 매니저',
  '맞춤 분석',
] as const;

type FeatureName = (typeof FEATURES)[number];

const TIERS: PricingTier[] = [
  {
    name: '무료',
    price: '₩0',
    period: '영구 무료',
    features: {
      '업소 등록': true,
      '기본 통계': false,
      '리뷰 관리': false,
      '프리미엄 배지': false,
      '이벤트 등록': false,
      'API 접근': false,
      '우선 노출': false,
      '전담 매니저': false,
      '맞춤 분석': false,
    },
    cta: '무료로 시작',
    highlighted: false,
    popular: false,
    borderClass: 'border-neon-border',
  },
  {
    name: '베이직',
    price: '₩29,000',
    period: '/ 월',
    features: {
      '업소 등록': true,
      '기본 통계': true,
      '리뷰 관리': true,
      '프리미엄 배지': false,
      '이벤트 등록': false,
      'API 접근': false,
      '우선 노출': false,
      '전담 매니저': false,
      '맞춤 분석': false,
    },
    cta: '베이직 시작',
    highlighted: false,
    popular: false,
    borderClass: 'border-neon-border',
  },
  {
    name: '프로',
    price: '₩49,000',
    period: '/ 월',
    features: {
      '업소 등록': true,
      '기본 통계': true,
      '리뷰 관리': true,
      '프리미엄 배지': true,
      '이벤트 등록': true,
      'API 접근': true,
      '우선 노출': false,
      '전담 매니저': false,
      '맞춤 분석': false,
    },
    cta: '프로 시작',
    highlighted: false,
    popular: true,
    borderClass: 'border-neon-primary',
  },
  {
    name: '프리미엄',
    price: '₩99,000',
    period: '/ 월',
    features: {
      '업소 등록': true,
      '기본 통계': true,
      '리뷰 관리': true,
      '프리미엄 배지': true,
      '이벤트 등록': true,
      'API 접근': true,
      '우선 노출': true,
      '전담 매니저': true,
      '맞춤 분석': true,
    },
    cta: '프리미엄 시작',
    highlighted: true,
    popular: false,
    borderClass: 'border-neon-gold',
  },
];

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-neon-green"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5 text-neon-text-muted/40"
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
  );
}

interface PricingTableProps {
  onSelect?: (tierName: string) => void;
  compact?: boolean;
}

export default function PricingTable({ onSelect, compact = false }: PricingTableProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSelect = (tierName: string) => {
    setSelectedTier(tierName);
    onSelect?.(tierName);
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className={`hidden ${compact ? '' : 'lg:block'}`}>
        <div className="overflow-hidden rounded-2xl border border-neon-border bg-neon-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neon-border">
                <th className="p-4 text-left text-sm font-medium text-neon-text-muted">
                  기능
                </th>
                {TIERS.map((tier) => (
                  <th key={tier.name} className="relative p-4 text-center">
                    {tier.popular && (
                      <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-primary px-3 py-0.5 text-xs font-semibold text-white">
                        인기
                      </span>
                    )}
                    <div className="text-lg font-bold text-neon-text">{tier.name}</div>
                    <div className="mt-1">
                      <span className="text-2xl font-bold text-neon-text">{tier.price}</span>
                      <span className="text-sm text-neon-text-muted">{tier.period}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, idx) => (
                <tr
                  key={feature}
                  className={`border-b border-neon-border/50 ${
                    idx % 2 === 0 ? 'bg-neon-surface' : 'bg-neon-surface-2/30'
                  }`}
                >
                  <td className="p-4 text-sm text-neon-text">{feature}</td>
                  {TIERS.map((tier) => (
                    <td key={`${tier.name}-${feature}`} className="p-4 text-center">
                      {tier.features[feature] ? <CheckIcon /> : <XIcon />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="p-4" />
                {TIERS.map((tier) => (
                  <td key={`cta-${tier.name}`} className="p-4 text-center">
                    <button
                      onClick={() => handleSelect(tier.name)}
                      className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        tier.highlighted
                          ? 'border-2 border-neon-gold bg-neon-gold/10 text-neon-gold hover:bg-neon-gold/20'
                          : tier.popular
                            ? 'bg-gradient-to-r from-neon-primary to-neon-primary-dark text-white shadow-lg shadow-neon-primary/20 hover:from-neon-primary-light hover:to-neon-primary'
                            : 'border border-neon-border bg-neon-surface-2 text-neon-text hover:bg-neon-surface-2/80'
                      } ${selectedTier === tier.name ? 'ring-2 ring-neon-primary ring-offset-2 ring-offset-neon-bg' : ''}`}
                    >
                      {tier.cta}
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile / Compact Card View */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${compact ? '' : 'lg:hidden'}`}>
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border-2 p-5 transition-all duration-300 ${
              tier.borderClass
            } ${
              selectedTier === tier.name
                ? 'ring-2 ring-neon-primary ring-offset-2 ring-offset-neon-bg'
                : ''
            } bg-neon-surface hover:bg-neon-surface-2/50`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neon-primary px-3 py-0.5 text-xs font-semibold text-white">
                인기
              </span>
            )}
            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold text-neon-text">{tier.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-neon-text">{tier.price}</span>
                <span className="text-sm text-neon-text-muted"> {tier.period}</span>
              </div>
            </div>

            <ul className="mb-5 space-y-2">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  {tier.features[feature] ? <CheckIcon /> : <XIcon />}
                  <span
                    className={
                      tier.features[feature] ? 'text-neon-text' : 'text-neon-text-muted/50'
                    }
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelect(tier.name)}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                tier.highlighted
                  ? 'border-2 border-neon-gold bg-neon-gold/10 text-neon-gold hover:bg-neon-gold/20'
                  : tier.popular
                    ? 'bg-gradient-to-r from-neon-primary to-neon-primary-dark text-white shadow-lg shadow-neon-primary/20 hover:from-neon-primary-light hover:to-neon-primary'
                    : 'border border-neon-border bg-neon-surface-2 text-neon-text hover:bg-neon-surface-2/80'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
