import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEngagementStore } from '@/lib/engagement-store';

/**
 * PointGate — 포인트 등급 잠금 컴포넌트
 *
 * 포인트가 부족하면 children 대신 잠금 UI를 보여주고,
 * 클릭 시 팝업으로 등급 안내를 띄운다.
 */

interface GateLevel {
  points: number;
  icon: string;
  name: string;
}

const LEVELS: GateLevel[] = [
  { points: 100, icon: '⭐', name: '탐험가' },
  { points: 300, icon: '🔥', name: '매니아' },
  { points: 700, icon: '💎', name: 'VIP' },
  { points: 1500, icon: '👑', name: '레전드' },
  { points: 3000, icon: '🔥', name: '마스터' },
  { points: 5000, icon: '✨', name: '신화' },
];

function getRequiredLevel(minPoints: number): GateLevel {
  return LEVELS.find(l => l.points >= minPoints) || LEVELS[LEVELS.length - 1];
}

interface PointGateProps {
  /** 필요 최소 포인트 */
  minPoints: number;
  /** 잠금 해제 시 보여줄 내용 */
  children: React.ReactNode;
  /** 잠금 상태에서 보여줄 대체 UI (선택). 없으면 기본 잠금 카드 */
  lockedFallback?: React.ReactNode;
}

export default function PointGate({ minPoints, children, lockedFallback }: PointGateProps) {
  const points = useEngagementStore((s) => s.points);
  const [showPopup, setShowPopup] = useState(false);

  if (points >= minPoints) return <>{children}</>;

  const required = getRequiredLevel(minPoints);
  const progress = Math.min(100, (points / minPoints) * 100);
  const remaining = minPoints - points;

  return (
    <>
      {/* 잠금 UI */}
      <div onClick={() => setShowPopup(true)} className="cursor-pointer">
        {lockedFallback || (
          <div className="rounded-2xl border-2 border-dashed p-8 text-center transition hover:border-[#8B5CF6]/50 hover:bg-[#F8F7FF]" style={{ borderColor: '#D1D5DB' }}>
            <span className="text-4xl">🔒</span>
            <p className="mt-3 text-sm font-bold" style={{ color: '#111' }}>
              {required.icon} {required.name} 등급부터 사용 가능
            </p>
            <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>
              {remaining}P 더 모으면 해금 · 탭해서 자세히 보기
            </p>
          </div>
        )}
      </div>

      {/* 팝업 */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowPopup(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }} onClick={(e) => e.stopPropagation()}>
            {/* 잠금 아이콘 */}
            <div className="text-center mb-4">
              <span className="text-5xl">🔒</span>
            </div>

            {/* 등급 안내 */}
            <h3 className="text-center text-lg font-bold mb-1" style={{ color: '#FFFFFF' }}>
              {required.icon} {required.name} 등급부터 사용 가능
            </h3>
            <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>
              포인트를 모아서 등급을 올리면 이 기능이 열립니다
            </p>

            {/* 진행률 */}
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>현재 포인트</span>
                <span className="text-sm font-bold" style={{ color: '#A78BFA' }}>{points}P / {minPoints}P</span>
              </div>
              <div className="h-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#8B5CF6' }} />
              </div>
              <p className="mt-2 text-center text-sm font-bold" style={{ color: '#A78BFA' }}>
                {remaining}P만 더 모으면 해금!
              </p>
            </div>

            {/* 포인트 모으는 방법 */}
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#FFFFFF' }}>포인트 모으는 방법</p>
              <div className="space-y-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <p>📖 페이지 스크롤 → 3~12P</p>
                <p>⏰ 사이트 체류 → 10~500P</p>
                <p>🗳️ VS 투표·퀴즈 → 20~30P</p>
                <p>🔥 연속 출석 → 보너스 2배</p>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 rounded-xl py-3 text-sm font-medium min-h-[44px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                닫기
              </button>
              <Link
                to="/"
                onClick={() => setShowPopup(false)}
                className="flex-1 rounded-xl py-3 text-center text-sm font-bold text-white min-h-[44px]"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                포인트 모으러 가기
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** 인라인 잠금 — 작은 영역에서 사용 */
export function PointGateInline({ minPoints, children }: { minPoints: number; children: React.ReactNode }) {
  const points = useEngagementStore((s) => s.points);
  const [showPopup, setShowPopup] = useState(false);

  if (points >= minPoints) return <>{children}</>;

  const required = getRequiredLevel(minPoints);
  const remaining = minPoints - points;
  const progress = Math.min(100, (points / minPoints) * 100);

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="w-full rounded-xl border-2 border-dashed py-3 text-sm font-medium transition hover:border-[#8B5CF6]/50 min-h-[44px]"
        style={{ borderColor: '#D1D5DB', color: '#9CA3AF' }}
      >
        🔒 {required.icon} {required.name} 등급 필요 ({remaining}P 더)
      </button>

      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowPopup(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4"><span className="text-5xl">🔒</span></div>
            <h3 className="text-center text-lg font-bold mb-1" style={{ color: '#FFFFFF' }}>{required.icon} {required.name} 등급부터 사용 가능</h3>
            <div className="mt-4 rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
              <div className="flex justify-between mb-2 text-sm">
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>현재</span>
                <span className="font-bold" style={{ color: '#A78BFA' }}>{points}P / {minPoints}P</span>
              </div>
              <div className="h-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: '#8B5CF6' }} />
              </div>
              <p className="mt-2 text-center text-sm font-bold" style={{ color: '#A78BFA' }}>{remaining}P 더!</p>
            </div>
            <button onClick={() => setShowPopup(false)} className="w-full rounded-xl py-3 text-sm font-medium min-h-[44px]" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>닫기</button>
          </div>
        </div>
      )}
    </>
  );
}
