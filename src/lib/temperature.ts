import { createClient } from '@/lib/supabase';

// ── 밤의 온도 등급 (당근 매너온도 36.5도 모티브) ──
// color: AA color-contrast 통과 (4.5:1, 작은 bold 텍스트용 다크 shade)
export const TEMPERATURE_LEVELS = [
  { key: 'newbie',    name: '새내기',   emoji: '🌱', minTemp: 36.5, color: '#4B5563', glow: false }, // 회색
  { key: 'regular',   name: '단골',     emoji: '🍺', minTemp: 40,   color: '#1D4ED8', glow: false }, // 파랑
  { key: 'cooler',    name: '놀쿨러',   emoji: '🎵', minTemp: 50,   color: '#047857', glow: false }, // 초록
  { key: 'hotplace',  name: '핫플러',   emoji: '🔥', minTemp: 60,   color: '#C2410C', glow: false }, // 주황
  { key: 'king',      name: '밤의제왕', emoji: '⭐', minTemp: 75,   color: '#7E22CE', glow: true  }, // 보라+글로우
  { key: 'legend',    name: '레전드',   emoji: '👑', minTemp: 90,   color: '#92400E', glow: true  }, // 금색+글로우
] as const;

export type TemperatureLevelKey = (typeof TEMPERATURE_LEVELS)[number]['key'];

// 온도 → 등급 정보
type TempLevel = (typeof TEMPERATURE_LEVELS)[number];
export function getTemperatureLevel(temp: number) {
  let level: TempLevel = TEMPERATURE_LEVELS[0];
  for (const l of TEMPERATURE_LEVELS) {
    if (temp >= l.minTemp) level = l;
  }
  const idx = TEMPERATURE_LEVELS.findIndex(l => l.key === level.key);
  const next = idx < TEMPERATURE_LEVELS.length - 1 ? TEMPERATURE_LEVELS[idx + 1] : null;
  const progress = next
    ? ((temp - level.minTemp) / (next.minTemp - level.minTemp)) * 100
    : 100;
  const tempToNext = next ? Math.max(0, next.minTemp - temp) : 0;

  return {
    ...level,
    temperature: temp,
    progress: Math.min(progress, 100),
    nextLevel: next,
    tempToNext: Number(tempToNext.toFixed(1)),
  };
}

// ── 활동 보상 (Supabase RPC 호출) ──
export type ActivityAction =
  | 'post' | 'comment' | 'like_received' | 'best_post'
  | 'photo_attach' | 'review' | 'vote';

/**
 * 활동 보상 (온도 +N도, 시즌 미션 진행, 칭호 자동 해제)
 * 호출 후 새 온도 반환
 */
export async function rewardActivity(userId: string, action: ActivityAction) {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('reward_activity', {
    p_user_id: userId,
    p_action: action,
  });
  if (error) {
    console.warn('[reward_activity]', error.message);
    return null;
  }
  return data as number; // 새 온도
}

/**
 * 출석 체크 (스트릭 자동 계산)
 */
export async function markAttendance(userId: string) {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('mark_attendance', { p_user_id: userId });
  if (error) {
    console.warn('[mark_attendance]', error.message);
    return null;
  }
  return data as { already_today?: boolean; streak: number; bonus?: number; temperature: number };
}

/**
 * 사용자 프로필 + 온도 + 칭호 종합 조회
 */
export async function fetchUserTempProfile(userId: string) {
  const supabase = createClient();
  if (!supabase) return null;

  const [profileRes, titlesRes, missionsRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('user_titles')
      .select('id, unlocked_at, titles(*)')
      .eq('user_id', userId),
    supabase.from('user_season_progress')
      .select('*, season_missions(*)')
      .eq('user_id', userId),
  ]);

  return {
    profile: profileRes.data,
    titles: titlesRes.data || [],
    missions: missionsRes.data || [],
  };
}
