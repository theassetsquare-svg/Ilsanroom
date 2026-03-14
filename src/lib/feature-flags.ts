// Feature flag system for gradual rollouts

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;      // global kill switch
  rolloutPercent: number; // 0-100
  allowList?: string[];   // always-on user IDs
  startDate?: string;     // ISO date
  endDate?: string;       // ISO date
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  personalized_recommendations: {
    id: 'personalized_recommendations',
    name: '개인화 추천',
    description: '최근 본 업소/좋아요 기반 추천',
    enabled: true,
    rolloutPercent: 50,
  },
  weather_recommendations: {
    id: 'weather_recommendations',
    name: '날씨 연동 추천',
    description: '현재 날씨에 맞는 업소 추천',
    enabled: true,
    rolloutPercent: 50,
  },
  time_based_recommendations: {
    id: 'time_based_recommendations',
    name: '시간대별 추천',
    description: '현재 시간에 맞는 추천 코스',
    enabled: true,
    rolloutPercent: 100,
  },
  community_live_chat: {
    id: 'community_live_chat',
    name: '커뮤니티 실시간 채팅',
    description: '게시판 내 실시간 채팅 기능',
    enabled: false,
    rolloutPercent: 0,
  },
  ai_chatbot_v2: {
    id: 'ai_chatbot_v2',
    name: 'AI 챗봇 v2',
    description: '개선된 AI 업소 추천 챗봇',
    enabled: true,
    rolloutPercent: 30,
  },
  dark_mode_redesign: {
    id: 'dark_mode_redesign',
    name: '다크모드 리디자인',
    description: '새로운 다크모드 컬러 팔레트',
    enabled: false,
    rolloutPercent: 0,
  },
};

function hashUserId(userId: string, flagId: string): number {
  let hash = 0;
  const combined = `${flagId}_${userId}`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

export function isFeatureEnabled(flagId: string, userId?: string): boolean {
  const flag = FEATURE_FLAGS[flagId];
  if (!flag || !flag.enabled) return false;

  // Check date range
  const now = new Date();
  if (flag.startDate && now < new Date(flag.startDate)) return false;
  if (flag.endDate && now > new Date(flag.endDate)) return false;

  // Check allow list
  if (userId && flag.allowList?.includes(userId)) return true;

  // Percentage rollout
  if (flag.rolloutPercent >= 100) return true;
  if (flag.rolloutPercent <= 0) return false;

  const id = userId || (typeof window !== 'undefined'
    ? localStorage.getItem('neon_user_id') || 'anonymous'
    : 'server');

  return hashUserId(id, flagId) < flag.rolloutPercent;
}

// React hook for client-side feature flags
export function useFeatureFlag(flagId: string): boolean {
  if (typeof window === 'undefined') return false;
  const userId = localStorage.getItem('neon_user_id') || undefined;
  return isFeatureEnabled(flagId, userId);
}
