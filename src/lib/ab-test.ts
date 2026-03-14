// A/B Testing framework
// Assigns users to variants deterministically based on a hash of their ID

type Variant = 'A' | 'B';

interface ABTest {
  id: string;
  name: string;
  variants: { A: string; B: string }; // descriptions
  trafficSplit: number; // 0-100, percentage for variant A
}

// Active experiments
export const EXPERIMENTS: Record<string, ABTest> = {
  quiz_result_share: {
    id: 'quiz_result_share',
    name: '퀴즈 결과 공유 버튼 위치',
    variants: {
      A: '결과 카드 내부 공유 버튼',
      B: '결과 하단 대형 공유 배너',
    },
    trafficSplit: 50,
  },
  cta_color: {
    id: 'cta_color',
    name: 'CTA 버튼 색상',
    variants: {
      A: '바이올렛 (기존)',
      B: '그라데이션 골드',
    },
    trafficSplit: 50,
  },
  venue_card_layout: {
    id: 'venue_card_layout',
    name: '업소 카드 레이아웃',
    variants: {
      A: '세로형 카드',
      B: '가로형 카드',
    },
    trafficSplit: 50,
  },
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getVariant(experimentId: string, userId?: string): Variant {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) return 'A';

  // Use userId or generate from timestamp for anonymous users
  const id = userId || (typeof window !== 'undefined'
    ? localStorage.getItem('neon_ab_id') || (() => {
        const newId = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('neon_ab_id', newId);
        return newId;
      })()
    : 'server');

  const hash = hashCode(`${experimentId}_${id}`);
  return (hash % 100) < experiment.trafficSplit ? 'A' : 'B';
}

export function trackABEvent(experimentId: string, variant: Variant, event: string) {
  if (typeof window === 'undefined') return;
  // Log to console; in production use Supabase directly
  console.debug('[AB]', experimentId, variant, event);
}
