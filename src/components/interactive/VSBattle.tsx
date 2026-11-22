import { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';

/* ── 배틀 데이터 (서버 집계 없음 — 방문자 본인 선택만 이 기기에 저장) ── */
const BATTLES = [
  { a: '강남 클럽', b: '홍대 클럽', topic: '🔥 클럽은 어디가 더 미쳤어?' },
  { a: '나이트', b: '클럽', topic: '🌙 금요일 밤, 뭐 탈래?' },
  { a: '라운지', b: '호빠', topic: '🍸 프라이빗한 밤을 원한다면?' },
  { a: '일산 룸', b: '강남 룸', topic: '🚪 격 있는 룸 대결!' },
  { a: '소셜댄스', b: 'EDM 프리스타일', topic: '💃 당신의 춤 스타일은?' },
  { a: '혼자 라운지', b: '친구랑 클럽', topic: '🎵 오늘 밤 어떤 기분?' },
  { a: '테이블석', b: '스탠딩', topic: '🪩 어디서 놀래?' },
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

  const battle = BATTLES[battleIdx];
  const hasVoted = voted[battleIdx];

  const vote = (side: 'a' | 'b') => {
    if (hasVoted) return;
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
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-3 px-2">
              <span className="text-sm font-bold text-[#111] text-center">{battle.a}</span>
              {hasVoted === 'a' && (
                <span className="mt-2 rounded-full bg-[#8B5CF6] px-2 py-0.5 text-xs font-bold text-white">내 선택</span>
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
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-3 px-2">
              <span className="text-sm font-bold text-[#111] text-center">{battle.b}</span>
              {hasVoted === 'b' && (
                <span className="mt-2 rounded-full bg-[#EC4899] px-2 py-0.5 text-xs font-bold text-white">내 선택</span>
              )}
            </div>
          </button>
        </div>

        {/* 내 선택 안내 */}
        {hasVoted ? (
          <p className="text-xs text-center font-medium text-[#8B5CF6]">
            내 선택: <span className="font-bold">{hasVoted === 'a' ? battle.a : battle.b}</span>
          </p>
        ) : (
          <p className="text-xs text-center text-[#999]">마음에 드는 쪽을 골라 보세요</p>
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
