import { createClient } from '@/lib/supabase';

// ── 등급 정의 (네이버 카페 패턴) ──
export const USER_LEVELS = [
  { key: 'newbie', name: '신입', minPoints: 0, icon: '🌱', color: 'text-neutral-500', bg: 'bg-neutral-100' },
  { key: 'regular', name: '정회원', minPoints: 50, icon: '🎵', color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'loyal', name: '단골', minPoints: 300, icon: '🔥', color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'vip', name: 'VIP', minPoints: 1000, icon: '👑', color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'expert', name: '전문가', minPoints: 9999, icon: '💎', color: 'text-violet-600', bg: 'bg-violet-100' },
] as const;

export type UserLevelKey = (typeof USER_LEVELS)[number]['key'];

// ── 포인트 보상 ──
export const POINT_REWARDS = {
  review: 10,
  comment: 5,
  upvote_received: 2,
  photo_upload: 5,
  post: 8,
} as const;

// 포인트로 등급 계산
export function getLevelFromPoints(points: number) {
  let level: (typeof USER_LEVELS)[number] = USER_LEVELS[0];
  for (const l of USER_LEVELS) {
    if (points >= l.minPoints) level = l;
  }
  const idx = USER_LEVELS.indexOf(level);
  const next = idx < USER_LEVELS.length - 1 ? USER_LEVELS[idx + 1] : null;
  const progress = next
    ? ((points - level.minPoints) / (next.minPoints - level.minPoints)) * 100
    : 100;
  return { ...level, points, progress: Math.min(progress, 100), nextLevel: next };
}

// 사용자 프로필 조회
export async function fetchUserProfile(userId: string) {
  const supabase = createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

// 프로필 없으면 생성 (upsert)
export async function ensureUserProfile(userId: string, nickname?: string) {
  const supabase = createClient();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (existing) return existing;

  const { data } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      nickname: nickname || `회원${userId.slice(0, 6)}`,
      level: 'newbie',
      points: 0,
    })
    .select()
    .single();

  return data;
}

// 등급 자동 갱신
export async function refreshUserLevel(userId: string) {
  const supabase = createClient();
  if (!supabase) return;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('points, level')
    .eq('user_id', userId)
    .single();

  if (!profile) return;

  const newLevel = getLevelFromPoints(profile.points);
  if (newLevel.key !== profile.level) {
    await supabase
      .from('user_profiles')
      .update({ level: newLevel.key })
      .eq('user_id', userId);

    // 등급 상승 알림
    if (USER_LEVELS.findIndex(l => l.key === newLevel.key) > USER_LEVELS.findIndex(l => l.key === profile.level)) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'level_up',
        title: '등급이 올랐어요!',
        message: `축하합니다! ${newLevel.icon} ${newLevel.name} 등급으로 승급했습니다!`,
        link: '/profile',
      });
    }
  }
}
