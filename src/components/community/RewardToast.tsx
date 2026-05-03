import { useEffect, useState } from 'react';
import { getTemperatureLevel } from '@/lib/temperature';

type RewardToastData = {
  delta: number;           // +0.3
  newTemp: number;         // 47.2
  reason: string;          // "글 작성"
  missionProgress?: { current: number; goal: number; name: string };
};

type Props = {
  data: RewardToastData | null;
  onClose: () => void;
};

/**
 * 글/댓글 작성 직후 도파민 트리거 토스트
 * "+0.3도 (현재 47.2도)" + 시즌 미션 진행도
 */
export function RewardToast({ data, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!data) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    const t2 = setTimeout(onClose, 4000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [data, onClose]);

  if (!data) return null;

  const level = getTemperatureLevel(data.newTemp);
  const isPositive = data.delta >= 0;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s ease-out',
        zIndex: 9999,
        backgroundColor: '#FFFFFF',
        border: `2px solid ${level.color}`,
        borderRadius: 16,
        padding: '14px 18px',
        minWidth: 280,
        maxWidth: '90vw',
        boxShadow: `0 12px 32px ${level.color}40, 0 4px 12px rgba(0,0,0,0.1)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            fontSize: 28,
            filter: level.glow ? `drop-shadow(0 0 8px ${level.color})` : undefined,
          }}
        >
          {isPositive ? '🎉' : '😢'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: '#888', margin: 0, fontWeight: 600 }}>
            {data.reason}
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: isPositive ? level.color : '#EF4444',
              margin: '2px 0 4px',
              lineHeight: 1.2,
            }}
          >
            {isPositive ? '+' : ''}{data.delta.toFixed(1)}°
            <span style={{ fontSize: 12, color: '#666', marginLeft: 8, fontWeight: 600 }}>
              현재 {data.newTemp.toFixed(1)}°
            </span>
          </p>
          {data.missionProgress && (
            <p style={{ fontSize: 11, color: level.color, margin: 0, fontWeight: 700 }}>
              📅 {data.missionProgress.name} {data.missionProgress.current}/{data.missionProgress.goal}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 전역 헬퍼: 어디서나 호출 가능 ──
let _setToast: ((data: RewardToastData) => void) | null = null;

export function showReward(data: RewardToastData) {
  if (_setToast) _setToast(data);
}

/**
 * 앱 루트에 한번 마운트
 */
export function RewardToastProvider() {
  const [data, setData] = useState<RewardToastData | null>(null);

  useEffect(() => {
    _setToast = setData;
    return () => { _setToast = null; };
  }, []);

  return <RewardToast data={data} onClose={() => setData(null)} />;
}
