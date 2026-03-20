

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * ★ 출석 스트릭 + 탐험 진행률 + 미완성 도전 ★
 *
 * 심리학:
 * - 스트릭: 연속 출석 깨지기 싫어서 매일 접속 (손실 회피)
 * - 진행률 바: 100% 채우고 싶은 욕구 (자이가르닉 효과)
 * - 미완성 도전: 안 한 활동이 보이면 하고 싶음 (완료 편향)
 * - 포인트/레벨: 숫자가 올라가는 재미 (도파민 루프)
 */

const STORAGE_KEY = 'dwell_engine';

interface EngineState {
  streak: number;
  points: number;
  level: number;
  venuesExplored: string[];
  quizDone: boolean;
  rouletteDone: boolean;
  vsDone: boolean;
  totalVisits: number;
}

const LEVEL_NAMES = ['🌱 뉴비', '🎵 탐험가', '🎉 파티피플', '👑 VIP', '🔥 레전드'];
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500];

function getLevelInfo(points: number) {
  let lvl = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) { lvl = i; break; }
  }
  const name = LEVEL_NAMES[lvl] || LEVEL_NAMES[0];
  const nextThreshold = LEVEL_THRESHOLDS[lvl + 1] || LEVEL_THRESHOLDS[lvl] + 500;
  const progress = Math.min(100, Math.round(((points - LEVEL_THRESHOLDS[lvl]) / (nextThreshold - LEVEL_THRESHOLDS[lvl])) * 100));
  return { lvl, name, progress, nextThreshold };
}

export default function StreakAndProgress() {
  const [state, setState] = useState<EngineState | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved));
    } catch {}
  }, []);

  if (!state) return null;

  const { name, progress, nextThreshold } = getLevelInfo(state.points);
  const explorationPct = Math.round((state.venuesExplored.length / 127) * 100);

  const todos = [
    !state.quizDone && { label: '밤문화 MBTI 테스트', href: '/quiz', emoji: '🧠', pts: '+20P' },
    !state.rouletteDone && { label: '오늘 갈 곳 룰렛', href: '/roulette', emoji: '🎰', pts: '+20P' },
    !state.vsDone && { label: 'VS 대결 투표', href: '/vs', emoji: '⚔️', pts: '+20P' },
    state.venuesExplored.length < 10 && { label: `업소 ${10 - state.venuesExplored.length}곳 더 탐색`, href: '/clubs', emoji: '🔍', pts: '+5P/곳' },
  ].filter(Boolean) as { label: string; href: string; emoji: string; pts: string }[];

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        {/* Header: 스트릭 + 레벨 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] text-lg">
              🔥
            </div>
            <div>
              <p className="text-sm font-bold text-[#111]">{state.streak}일 연속 출석</p>
              <p className="text-xs text-[#555]">{name} · {state.points}P</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#555]">방문 {state.totalVisits}회</p>
            <p className="text-xs text-[#8B5CF6]">탐험 {state.venuesExplored.length}/127</p>
          </div>
        </div>

        {/* 레벨 프로그레스 바 */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#555] mb-1">
            <span>다음 레벨까지</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#F3F0FF] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 탐험 진행률 */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#555] mb-1">
            <span>전국 업소 탐험률</span>
            <span>{explorationPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#FEF3C7] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#EF4444] transition-all duration-1000"
              style={{ width: `${explorationPct}%` }}
            />
          </div>
        </div>

        {/* 미완성 도전 (자이가르닉 효과) */}
        {todos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#BE185D] mb-2">🎯 아직 안 한 활동이 있어요!</p>
            <div className="space-y-2">
              {todos.map((todo, i) => (
                <Link key={i}
                  href={todo.href}
                  className="flex items-center gap-3 rounded-xl bg-[#FDF2F8] px-4 py-3 text-sm transition hover:bg-[#FCE7F3]"
                  style={{ minHeight: 44 }}
                >
                  <span>{todo.emoji}</span>
                  <span className="flex-1 font-medium text-[#111]">{todo.label}</span>
                  <span className="text-xs font-bold text-[#8B5CF6]">{todo.pts}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 7일 스트릭 보너스 */}
        {state.streak >= 7 && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] p-4 text-center text-white">
            <p className="text-sm font-bold">🎉 {state.streak}일 연속 출석! 보너스 포인트 획득!</p>
          </div>
        )}
      </div>
    </section>
  );
}
