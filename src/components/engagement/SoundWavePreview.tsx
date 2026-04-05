
import { useState } from 'react';

/**
 * [5] SOUND WAVE PREVIEW — Tiny animated sound wave icon on venue card
 * Tap = visual audio preview of venue vibe. Instant feel.
 */
const vibeLabels: Record<string, string> = {
  club: 'EDM 비트가 울리는 중...',
  night: '라이브 밴드 연주 중...',
  lounge: '재즈 선율이 흐르는 중...',
  room: '노래방 열기가 뜨거운 중...',
  yojeong: '국악 가락이 은은한 중...',
  hoppa: '신나는 음악이 흐르는 중...',
};

function SoundBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${
            active ? 'bg-[#8B5CF6]' : 'bg-gray-300'
          }`}
          style={{
            height: active ? `${h * 100}%` : '30%',
            animation: active ? `soundBar 0.${4 + i}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes soundBar {
          0% { height: 30%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function SoundWavePreview({ category }: { category: string }) {
  const [playing, setPlaying] = useState(false);

  const handleTap = () => {
    if (playing) return;
    setPlaying(true);
    setTimeout(() => setPlaying(false), 3000);
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTap(); }}
      className="flex items-center gap-1.5 rounded-full bg-violet-50 px-2 py-1 transition-all hover:bg-violet-100"
      aria-label="사운드 미리듣기"
      style={{ minHeight: 28 }}
    >
      <SoundBars active={playing} />
      {playing && (
        <span className="text-[10px] font-medium text-[#8B5CF6] whitespace-nowrap">
          {vibeLabels[category] || '음악이 흐르는 중...'}
        </span>
      )}
    </button>
  );
}
