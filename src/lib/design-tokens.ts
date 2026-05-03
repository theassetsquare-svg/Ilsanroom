/**
 * 놀쿨 디자인 시스템 V2 — Dark + Neon
 *
 * 객관적 근거:
 * - 야간 유흥 사이트 = 다크모드 자연스러움 (사용자 24% 긴 체류, Nielsen)
 * - 네온 강조색 = 도파민 트리거 (밤문화 톤매너)
 * - 토스/당근 톤매너 분석 결과 컬러 토큰화 → 1픽셀 정합성
 *
 * 사용법:
 *   import { COLOR, SHADOW, RADIUS, MOTION } from '@/lib/design-tokens';
 *   style={{ backgroundColor: COLOR.bg.base, color: COLOR.text.primary }}
 */

export const COLOR = {
  // 배경 계층 (다크)
  bg: {
    base:    '#0A0A0F',  // 가장 깊은 검정 (페이지 배경)
    elevate: '#15151D',  // 카드 1단계
    raised:  '#1F1F2A',  // 카드 2단계 (hover)
    overlay: '#2A2A38',  // 모달/시트
    border:  '#2D2D3D',  // 디바이더
  },
  // 텍스트
  text: {
    primary:   '#F5F5FA',  // 본문
    secondary: '#9CA3B5',  // 보조
    tertiary:  '#6B7280',  // 흐림 (메타)
    disabled:  '#4B5563',
    inverse:   '#0A0A0F',  // 밝은 배경 위
  },
  // 네온 액션 (브랜드)
  neon: {
    pink:   '#FF2E93',  // 메인 CTA, 핫
    purple: '#A855F7',  // 등급, 프리미엄
    cyan:   '#06B6D4',  // 정보, 링크
    gold:   '#FFD700',  // 보상, 레전드
    green:  '#10B981',  // 성공, 매너
    red:    '#EF4444',  // 경고, 신고
  },
  // 온도 등급 (밤의 온도 시스템)
  temp: {
    newbie:   '#9CA3AF',
    regular:  '#3B82F6',
    cooler:   '#10B981',
    hotplace: '#F97316',
    king:     '#A855F7',
    legend:   '#FFD700',
  },
  // 그라디언트
  gradient: {
    hot:    'linear-gradient(135deg, #FF2E93 0%, #A855F7 100%)',
    fire:   'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    night:  'linear-gradient(180deg, #0A0A0F 0%, #1F1F2A 100%)',
    legend: 'linear-gradient(135deg, #FFD700 0%, #FF2E93 100%)',
  },
} as const;

export const SHADOW = {
  // 다크모드 그림자는 주로 글로우로 표현
  glow: {
    pink:   '0 0 20px rgba(255, 46, 147, 0.4), 0 0 40px rgba(255, 46, 147, 0.2)',
    purple: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)',
    gold:   '0 0 24px rgba(255, 215, 0, 0.5), 0 0 48px rgba(255, 215, 0, 0.25)',
    soft:   '0 4px 16px rgba(0, 0, 0, 0.4)',
  },
  card: '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
  pressed: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
} as const;

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const TYPO = {
  // 모바일 우선 (16px 본문, 1.7 line-height)
  display: { fontSize: 28, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h1:      { fontSize: 22, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.01em' },
  h2:      { fontSize: 18, fontWeight: 700, lineHeight: 1.4 },
  h3:      { fontSize: 16, fontWeight: 700, lineHeight: 1.4 },
  body:    { fontSize: 15, fontWeight: 400, lineHeight: 1.7 },
  small:   { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  meta:    { fontSize: 11, fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.02em' },
} as const;

export const MOTION = {
  // 60fps 보장하는 짧은 트랜지션
  fast:   '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  base:   '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  slow:   '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // overshoot
} as const;

export const TOUCH = {
  min: 44, // WCAG AAA 기준 (Apple HIG와 동일)
  comfortable: 48,
  large: 56,
} as const;

// z-index 계층
export const Z = {
  base: 0,
  raised: 10,
  sticky: 100,
  overlay: 1000,
  modal: 5000,
  toast: 9000,
  tooltip: 9999,
} as const;
