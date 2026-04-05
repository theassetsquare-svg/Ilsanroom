
import { useState, useEffect, useRef } from 'react';

/**
 * [7] STORY MODE — Full-screen vertical photo story like Instagram Stories
 * 6 steps with captions. Auto-advance 4sec. Tap to pause.
 * "입구 → 로비 → 메인홀 → 바 → VIP → 분위기" tour
 */

interface StoryStep {
  label: string;
  icon: string;
  description: string;
  bgGradient: string;
}

const storySteps: StoryStep[] = [
  { label: '입구', icon: '🚪', description: '첫인상이 결정된다. 외관부터 고급스러운 곳', bgGradient: 'from-gray-900 to-gray-700' },
  { label: '로비', icon: '✨', description: '웨이팅 없이 바로 입장. 직원이 자리까지 안내', bgGradient: 'from-violet-900 to-violet-700' },
  { label: '메인홀', icon: '🎵', description: '사운드 시스템이 다르다. 온몸으로 느끼는 비트', bgGradient: 'from-purple-900 to-purple-700' },
  { label: '바', icon: '🍸', description: '시그니처 칵테일 한 잔. 바텐더 추천이 정답', bgGradient: 'from-indigo-900 to-indigo-700' },
  { label: 'VIP', icon: '👑', description: '프라이빗 공간. 특별한 날에는 VIP가 답이다', bgGradient: 'from-amber-900 to-amber-700' },
  { label: '분위기', icon: '🔥', description: '한번 가면 단골 된다. 그 이유를 직접 확인하세요', bgGradient: 'from-red-900 to-red-700' },
];

export default function StoryMode({ venueName, onClose }: { venueName: string; onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const DURATION = 4000;
    const INTERVAL = 50;
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += INTERVAL;
      setProgress((elapsed / DURATION) * 100);

      if (elapsed >= DURATION) {
        setCurrent(prev => {
          if (prev >= storySteps.length - 1) {
            onClose();
            return prev;
          }
          return prev + 1;
        });
        elapsed = 0;
        setProgress(0);
      }
    }, INTERVAL);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, paused, onClose]);

  const step = storySteps[current];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      onClick={() => setPaused(prev => !prev)}
    >
      <div className={`flex-1 bg-gradient-to-b ${step.bgGradient} flex flex-col`}>
        {/* Progress bars */}
        <div className="flex gap-1 p-3 pt-[env(safe-area-inset-top,12px)]">
          {storySteps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              {venueName.charAt(0)}
            </div>
            <span className="text-sm font-bold text-white">{venueName}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex h-8 w-8 items-center justify-center text-white/80 text-xl"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <span className="text-6xl mb-4">{step.icon}</span>
          <p className="text-xs font-medium text-white/60 mb-2 tracking-wider uppercase">
            {current + 1} / {storySteps.length} — {step.label}
          </p>
          <h2 className="text-2xl font-black text-white leading-tight mb-3">{step.label}</h2>
          <p className="text-base text-white/80 leading-relaxed max-w-sm">{step.description}</p>
        </div>

        {/* Bottom hint */}
        <div className="text-center pb-8">
          <p className="text-xs text-white/50">
            {paused ? '탭하면 재생' : '탭하면 일시정지'}
          </p>
        </div>
      </div>
    </div>
  );
}
