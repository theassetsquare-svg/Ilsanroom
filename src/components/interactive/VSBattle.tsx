import { useState, useEffect, useMemo } from 'react';
import ShareButtons from './ShareButtons';

/* ── 배틀 데이터 — 기본 투표수 포함 (현실적 비율) ── */
const BATTLES = [
  { a: '강남 클럽', b: '홍대 클럽', topic: '🔥 클럽은 어디가 더 미쳤어?', baseA: 487, baseB: 412 },
  { a: '나이트', b: '클럽', topic: '🌙 금요일 밤, 뭐 탈래?', baseA: 356, baseB: 523 },
  { a: '라운지', b: '호빠', topic: '🍸 프라이빗한 밤을 원한다면?', baseA: 298, baseB: 341 },
  { a: '일산 룸', b: '강남 룸', topic: '🚪 격 있는 룸 대결!', baseA: 267, baseB: 389 },
  { a: '소셜댄스', b: 'EDM 프리스타일', topic: '💃 당신의 춤 스타일은?', baseA: 312, baseB: 445 },
  { a: '혼자 라운지', b: '친구랑 클럽', topic: '🎵 오늘 밤 어떤 기분?', baseA: 198, baseB: 467 },
  { a: '테이블석', b: '스탠딩', topic: '🪩 어디서 놀래?', baseA: 534, baseB: 321 },
];

/* ── localStorage 키 (날짜별) ── */
function getStorageKey() {
  const d = new Date();
  return `nolcool_vs_battle_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

export default function VSBattle() {
  const [battleIdx, setBattleIdx] = useState(0);

  // 날짜별 투표 저장/복원
  const [voted, setVoted] = useState<Record<number, 'a' | 'b'>>(() => {
    try {
      const s = localStorage.getItem(getStorageKey());
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  // 날짜 기반으로 기본 투표수에 변동 추가 (매일 다르게 보임)
  const dailyVotes = useMemo(() => {
    const d = new Date().getDate();
    return BATTLES.map((b, i) => ({
      a: b.baseA + ((d * 17 + i * 31) % 89),
      b: b.baseB + ((d * 23 + i * 47) % 73),
    }));
  }, []);

  const [extraVotes, setExtraVotes] = useState<Record<number, { a: number; b: number }>>({});

  const battle = BATTLES[battleIdx];
  const base = dailyVotes[battleIdx];
  const extra = extraVotes[battleIdx] || { a: 0, b: 0 };
  const totalA = base.a + extra.a;
  const totalB = base.b + extra.b;
  const total = totalA + totalB;
  const pctA = Math.round((totalA / total) * 100);
  const pctB = 100 - pctA;
  const hasVoted = voted[battleIdx];

  const vote = (side: 'a' | 'b') => {
    if (hasVoted) return;
    setExtraVotes(prev => ({
      ...prev,
      [battleIdx]: {
        a: (prev[battleIdx]?.a || 0) + (side === 'a' ? 1 : 0),
        b: (prev[battleIdx]?.b || 0) + (side === 'b' ? 1 : 0),
      },
    }));
    setVoted(prev => {
      const next = { ...prev, [battleIdx]: side };
      try { localStorage.setItem(getStorageKey(), JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const next = () => setBattleIdx(prev => (prev + 1) % BATTLES.length);
  const prev = () => setBattleIdx(p => (p - 1 + BATTLES.length) % BATTLES.length);

  // 오래된 localStorage 정리
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('nolcool_vs_battle_') && k !== getStorageKey());
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
  }, []);

  return (
    <div className="space-y-4">
      {/* 배틀 카드 */}
      <div className="rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-br from-white to-purple-50/50 p-5 shadow-sm">
        {/* 페이지 인디케이터 */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {BATTLES.map((_, i) => (
            <button key={i} onClick={() => setBattleIdx(i)} aria-label={`배틀 ${i + 1}`}
              className="relative inline-flex items-center justify-center min-w-[32px] min-h-[32px] px-2 py-3 -mx-1 -my-2">
              <span className={`block h-1.5 rounded-full transition-all ${i === battleIdx ? 'w-5 bg-[#8B5CF6]' : 'w-1.5 bg-gray-300'}`} />
            </button>
          ))}
        </div>

        <p className="text-base font-bold text-[#111] mb-4 text-center">{battle.topic}</p>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-4">
          {/* A 선택지 */}
          <button
            onClick={() => vote('a')}
            disabled={!!hasVoted}
            className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
              hasVoted === 'a' ? 'ring-2 ring-[#8B5CF6] shadow-lg scale-[1.02]' :
              hasVoted ? 'opacity-50' : 'hover:shadow-md active:scale-95'
            }`}
            style={{ minHeight: 100 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#8B5CF6]/5 to-[#8B5CF6]/15 rounded-xl" />
            {hasVoted && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#8B5CF6]/20 transition-all duration-700 rounded-b-xl"
                style={{ height: `${pctA}%` }} />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-3 px-2">
              <span className="text-sm font-bold text-[#111] text-center">{battle.a}</span>
              {hasVoted && (
                <span className="text-xl font-black text-[#8B5CF6] mt-2">{pctA}%</span>
              )}
            </div>
          </button>

          {/* VS 뱃지 */}
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-[#8B5CF6]">VS</span>
          </div>

          {/* B 선택지 */}
          <button
            onClick={() => vote('b')}
            disabled={!!hasVoted}
            className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
              hasVoted === 'b' ? 'ring-2 ring-[#EC4899] shadow-lg scale-[1.02]' :
              hasVoted ? 'opacity-50' : 'hover:shadow-md active:scale-95'
            }`}
            style={{ minHeight: 100 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#EC4899]/5 to-[#EC4899]/15 rounded-xl" />
            {hasVoted && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#EC4899]/20 transition-all duration-700 rounded-b-xl"
                style={{ height: `${pctB}%` }} />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-3 px-2">
              <span className="text-sm font-bold text-[#111] text-center">{battle.b}</span>
              {hasVoted && (
                <span className="text-xl font-black text-[#EC4899] mt-2">{pctB}%</span>
              )}
            </div>
          </button>
        </div>

        {/* 참여자 수 + 투표 유도 */}
        {hasVoted ? (
          <p className="text-xs text-center font-medium text-[#8B5CF6]">
            <span className="font-bold">{hasVoted === 'a' ? battle.a : battle.b}</span> 선택! · {total.toLocaleString()}명 참여
          </p>
        ) : (
          <p className="text-xs text-center text-[#999]">터치해서 투표하세요 · {total.toLocaleString()}명 참여 중</p>
        )}

        {/* 네비게이션 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button onClick={prev} className="text-sm text-[#999] hover:text-[#111] transition-colors" style={{ minHeight: 44 }}>← 이전</button>
          <span className="text-xs text-[#999]">{battleIdx + 1} / {BATTLES.length}</span>
          <button onClick={next} className="text-sm text-[#999] hover:text-[#111] transition-colors" style={{ minHeight: 44 }}>다음 →</button>
        </div>

        {hasVoted && (
          <div className="mt-3 flex justify-center">
            <ShareButtons title={`VS 배틀: ${battle.a} vs ${battle.b} — 내 선택: ${hasVoted === 'a' ? battle.a : battle.b}`} />
          </div>
        )}
      </div>
    </div>
  );
}
