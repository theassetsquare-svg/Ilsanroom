import { getTemperatureLevel } from '@/lib/temperature';

type Props = {
  temperature?: number | null;
  showNumber?: boolean;
  size?: 'sm' | 'md';
  titleEmoji?: string | null;
};

/**
 * 닉네임 옆에 붙는 온도 배지
 * 글/댓글마다 사용 → 사회적 영향력
 */
export function TemperatureBadge({ temperature, showNumber = true, size = 'sm', titleEmoji }: Props) {
  const temp = typeof temperature === 'number' ? temperature : 36.5;
  const level = getTemperatureLevel(temp);

  const fontSize = size === 'md' ? 13 : 11;
  const padX = size === 'md' ? 8 : 6;
  const padY = size === 'md' ? 3 : 2;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: `${padY}px ${padX}px`,
        fontSize,
        fontWeight: 700,
        borderRadius: 999,
        backgroundColor: `${level.color}15`,
        color: level.color,
        border: `1px solid ${level.color}30`,
        boxShadow: level.glow ? `0 0 8px ${level.color}50` : undefined,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden>{level.emoji}</span>
      <span>{level.name}</span>
      {showNumber && (
        <span style={{ opacity: 0.85, fontWeight: 600, marginLeft: 2 }}>
          {temp.toFixed(1)}°
        </span>
      )}
      {titleEmoji && (
        <span aria-hidden style={{ marginLeft: 2, opacity: 0.9 }}>
          {titleEmoji}
        </span>
      )}
    </span>
  );
}

/**
 * 온도계 진행 바 (마이페이지용)
 */
export function TemperatureBar({ temperature }: { temperature: number }) {
  const level = getTemperatureLevel(temperature);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
          {level.emoji} {level.name}
        </span>
        <span style={{ fontSize: 18, fontWeight: 900, color: level.color }}>
          {temperature.toFixed(1)}°
        </span>
      </div>
      <div
        style={{
          height: 10,
          width: '100%',
          backgroundColor: '#F3F4F6',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${level.progress}%`,
            background: `linear-gradient(90deg, ${level.color}AA, ${level.color})`,
            borderRadius: 999,
            transition: 'width 0.6s ease-out',
            boxShadow: level.glow ? `0 0 6px ${level.color}` : undefined,
          }}
        />
      </div>
      {level.nextLevel && (
        <p style={{ marginTop: 6, fontSize: 11, color: '#888' }}>
          {level.tempToNext}° 더 모으면 {level.nextLevel.emoji} {level.nextLevel.name} 등극!
        </p>
      )}
      {!level.nextLevel && (
        <p style={{ marginTop: 6, fontSize: 11, color: level.color, fontWeight: 700 }}>
          최고 등급 달성! 사이트의 전설입니다 👑
        </p>
      )}
    </div>
  );
}
