import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * ReadingEngagement — 글을 끝까지 읽게 만드는 시스템
 *
 * 1. 예상 읽기 시간 표시
 * 2. 읽기 진행률 마일스톤 (25%, 50%, 75%, 100%)
 * 3. 중간 훅 (호기심 유발 문구)
 * 4. 완독 보상 (숨겨진 정보 공개)
 * 5. "N명이 끝까지 읽었어요" 사회적 증거
 */

// ── 읽기 시간 계산 (한글 기준 분당 500자) ──
export function ReadTimeEstimate({ charCount, className }: { charCount: number; className?: string }) {
  const minutes = Math.max(1, Math.ceil(charCount / 500));
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-[#8B5CF6] font-medium ${className || ''}`}>
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {minutes}분 읽기
    </span>
  );
}

// ── 중간 훅 (호기심 유발) ──
const midHooks = [
  { emoji: '👇', text: '아래에 진짜 핵심이 있다' },
  { emoji: '🔥', text: '여기서부터가 진짜다' },
  { emoji: '💡', text: '이건 직접 가본 사람만 아는 정보' },
  { emoji: '⚡', text: '이 부분 놓치면 후회한다' },
  { emoji: '🎯', text: '끝까지 읽은 사람만 보는 꿀팁이 아래에' },
  { emoji: '👀', text: '다른 데선 절대 안 알려주는 내용' },
  { emoji: '🤫', text: '이건 아는 사람만 아는 거다' },
  { emoji: '💎', text: '여기부터 읽는 사람이 진짜 고수' },
];

export function MidContentHook({ seed, variant }: { seed?: string; variant?: number }) {
  const hook = useMemo(() => {
    if (variant !== undefined) return midHooks[variant % midHooks.length];
    if (seed) {
      const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return midHooks[hash % midHooks.length];
    }
    return midHooks[Math.floor(Math.random() * midHooks.length)];
  }, [seed, variant]);

  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" />
      <span className="flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 px-4 py-1.5 text-xs font-bold text-[#8B5CF6] whitespace-nowrap">
        {hook.emoji} {hook.text}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" />
    </div>
  );
}

// ── 읽기 마일스톤 (스크롤 진행률에 따라 표시) ──
const milestoneMessages = [
  { pct: 25, emoji: '📖', text: '벌써 25%! 계속 읽어봐' },
  { pct: 50, emoji: '🔥', text: '반 왔다! 핵심은 지금부터' },
  { pct: 75, emoji: '💪', text: '거의 다 왔어! 마지막이 제일 중요' },
  { pct: 100, emoji: '🎉', text: '끝까지 읽었어! 당신이 진짜다' },
];

export function ReadingMilestone({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [progress, setProgress] = useState(0);
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());
  const [activeMilestone, setActiveMilestone] = useState<typeof milestoneMessages[0] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = rect.top + window.scrollY;
      const containerHeight = rect.height;
      const scrollPos = window.scrollY + window.innerHeight;
      const pct = Math.min(100, Math.max(0, ((scrollPos - containerTop) / containerHeight) * 100));
      setProgress(Math.round(pct));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  useEffect(() => {
    for (const m of milestoneMessages) {
      if (progress >= m.pct && !shownMilestones.has(m.pct)) {
        setShownMilestones(prev => new Set(prev).add(m.pct));
        setActiveMilestone(m);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setActiveMilestone(null), 2500);
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [progress, shownMilestones]);

  if (!activeMilestone) return null;

  return (
    <div
      data-reading-milestone="true"
      className="fixed left-1/2 -translate-x-1/2 z-[45] animate-fade-in"
      style={{ bottom: 'calc(140px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-2 rounded-full bg-[#111]/90 px-5 py-2.5 text-white shadow-xl backdrop-blur-sm">
        <span className="text-lg">{activeMilestone.emoji}</span>
        <span className="text-sm font-bold">{activeMilestone.text}</span>
      </div>
    </div>
  );
}

// ── 완독 보상 (끝까지 읽은 사람만 보는 콘텐츠) ──
export function ReadCompletionReward({
  children,
  teaser,
  readerCount,
}: {
  children: React.ReactNode;
  teaser?: string;
  readerCount?: number;
}) {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 자동 표시: 이 영역이 뷰포트에 들어오면 reveal
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // 시드 기반 가짜 reader count 제거 (놀쿨 신뢰 규칙).
  void readerCount;

  return (
    <div ref={ref} className="my-8">
      {!revealed ? (
        <div className="rounded-2xl border-2 border-dashed border-[#8B5CF6]/30 bg-gradient-to-br from-[#F3F0FF] to-white p-6 text-center">
          <span className="text-3xl block mb-2">🔒</span>
          <p className="text-sm font-bold text-[#111] mb-1">
            {teaser || '끝까지 읽은 사람만 보는 숨겨진 정보'}
          </p>
          <p className="mt-2 text-xs text-[#999]">조금만 더 스크롤하면 공개됩니다</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-br from-[#F3F0FF] via-white to-[#FAFAFE] p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎉</span>
            <p className="text-sm font-bold text-[#8B5CF6]">끝까지 읽은 당신에게만 공개!</p>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

// ── 완독자 수 표시 — 시드 기반 가짜 카운터(놀쿨 신뢰 규칙) 제거. 호환을 위해 시그니처 유지.
export function ReadFinishCount(_: { pageName?: string; baseCount?: number }) {
  return null;
}

// ── 중간 퀴즈/질문 (인터랙티브) ──
export function MidContentQuiz({
  question,
  options,
  seed
}: {
  question: string;
  options: string[];
  seed?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  // 시드 기반 가짜 투표율·참여자 수 제거 (놀쿨 신뢰 규칙).
  // 사용자가 선택한 항목만 시각적으로 강조하고 비율 막대/참여자 수는 숨김.
  void seed;

  return (
    <div className="my-6 rounded-2xl border border-[#8B5CF6]/15 bg-gradient-to-br from-white to-[#FAFAFE] p-5">
      <p className="text-sm font-bold text-[#111] mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6]/10 text-xs">Q</span>
        {question}
      </p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            disabled={selected !== null}
            className={`relative w-full rounded-xl overflow-hidden text-left transition-all ${
              selected === i ? 'ring-2 ring-[#8B5CF6] bg-[#8B5CF6]/5' :
              selected !== null ? 'opacity-60' : 'hover:bg-gray-50 active:scale-[0.98]'
            }`}
            style={{ minHeight: 44 }}
          >
            <div className="relative z-10 flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-[#111]">{opt}</span>
              {selected === i && (
                <span className="text-xs font-bold text-[#8B5CF6]">선택함</span>
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-center text-[#999]">
        {selected !== null ? '의견 감사합니다' : '터치해서 참여하기'}
      </p>
    </div>
  );
}

// ── "다음에 뭐가 나오는지" 미리보기 ──
export function NextSectionTeaser({ text, emoji }: { text: string; emoji?: string }) {
  return (
    <div className="my-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6]/5 to-transparent py-2 px-4 border-l-3 border-[#8B5CF6]/30">
      <span className="text-sm">{emoji || '👇'}</span>
      <p className="text-xs font-medium text-[#8B5CF6]">{text}</p>
    </div>
  );
}

// ── 전체 읽기 인게이지먼트 래퍼 ──
export default function ReadingEngagement({
  children,
  charCount,
  pageName,
  showMilestones = true,
}: {
  children: React.ReactNode;
  charCount?: number;
  pageName?: string;
  showMilestones?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      {/* 읽기 시간 + 완독자 수 */}
      {(charCount || pageName) && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {charCount && <ReadTimeEstimate charCount={charCount} />}
          {pageName && <ReadFinishCount pageName={pageName} />}
        </div>
      )}

      {children}

      {/* 마일스톤 알림 */}
      {showMilestones && <ReadingMilestone containerRef={containerRef} />}
    </div>
  );
}
