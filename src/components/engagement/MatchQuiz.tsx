
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';

/**
 * [6] MATCH QUIZ — "나한테 맞는 곳은?" → 3 questions → personalized recommendation
 * Share result → viral. Retake → engagement.
 */

const questions = [
  {
    q: '오늘 기분이 어때?',
    options: [
      { label: '신나게 놀고 싶다!', value: 'energetic' },
      { label: '조용히 한잔 하고 싶다', value: 'chill' },
      { label: '기념일이다', value: 'special' },
    ],
  },
  {
    q: '누구랑 가?',
    options: [
      { label: '친구들과 단체로', value: 'group' },
      { label: '소수 인원 (2-3명)', value: 'small' },
      { label: '혼자', value: 'solo' },
    ],
  },
  {
    q: '예산은?',
    options: [
      { label: '가성비 최고', value: 'budget' },
      { label: '적당히', value: 'mid' },
      { label: '돈은 상관없다', value: 'premium' },
    ],
  },
];

type ResultType = 'club' | 'lounge' | 'night' | 'room' | 'yojeong' | 'hoppa';

const typeMap: Record<string, ResultType> = {
  'energetic-group-budget': 'club',
  'energetic-group-mid': 'club',
  'energetic-group-premium': 'club',
  'energetic-small-budget': 'night',
  'energetic-small-mid': 'club',
  'energetic-small-premium': 'lounge',
  'energetic-solo-budget': 'night',
  'energetic-solo-mid': 'hoppa',
  'energetic-solo-premium': 'lounge',
  'chill-group-budget': 'room',
  'chill-group-mid': 'room',
  'chill-group-premium': 'yojeong',
  'chill-small-budget': 'lounge',
  'chill-small-mid': 'lounge',
  'chill-small-premium': 'yojeong',
  'chill-solo-budget': 'lounge',
  'chill-solo-mid': 'lounge',
  'chill-solo-premium': 'yojeong',
  'special-group-budget': 'room',
  'special-group-mid': 'yojeong',
  'special-group-premium': 'yojeong',
  'special-small-budget': 'room',
  'special-small-mid': 'lounge',
  'special-small-premium': 'yojeong',
  'special-solo-budget': 'lounge',
  'special-solo-mid': 'lounge',
  'special-solo-premium': 'yojeong',
};

const typeLabels: Record<ResultType, string> = {
  club: '클럽',
  lounge: '라운지',
  night: '나이트',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

const typeDescriptions: Record<ResultType, string> = {
  club: '신나는 음악과 에너지 넘치는 분위기를 좋아하는 당신! 클럽이 딱이에요.',
  lounge: '분위기 있는 공간에서 여유롭게 즐기는 타입. 라운지가 제격이에요.',
  night: '라이브 음악과 함께 흥겨운 밤을 즐기는 당신! 나이트가 어울려요.',
  room: '프라이빗한 공간에서 편하게 즐기고 싶은 당신. 룸이 정답!',
  yojeong: '기념일엔 격이 다른 대접을 받아야지. 요정이 정답이에요.',
  hoppa: '재미있고 유쾌한 분위기를 원하는 당신! 호빠에서 즐겨보세요.',
};

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

export default function MatchQuiz() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const resultType = useMemo<ResultType>(() => {
    const key = answers.join('-');
    return typeMap[key] || 'lounge';
  }, [answers]);

  const recommendations = useMemo(() => {
    return venues
      .filter(v => v.status !== 'closed_or_unclear' && v.category === resultType)
      .slice(0, 3);
  }, [resultType]);

  const handleAnswer = (value: string) => {
    const next = [...answers, value];
    setAnswers(next);
    if (next.length >= 3) {
      setShowResult(true);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setShowResult(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 flex items-center gap-2 rounded-full bg-[#8B5CF6] px-4 py-3 text-white shadow-xl shadow-purple-300/40 transition-all hover:bg-[#7C3AED] active:scale-95"
        style={{ bottom: 72, right: 16, minHeight: 48 }}
      >
        <span className="text-lg">🎯</span>
        <span className="text-sm font-bold">나한테 맞는 곳은?</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {!showResult ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-[#111]">나한테 맞는 곳은?</h3>
              <button onClick={() => setOpen(false)} className="text-[#999] text-xl" style={{ minWidth: 44, minHeight: 44 }}>✕</button>
            </div>
            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {questions.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[#8B5CF6]' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-base font-bold text-[#111] mb-4">{questions[step].q}</p>
            <div className="space-y-2">
              {questions[step].options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-[#333] transition-all hover:border-[#8B5CF6] hover:bg-violet-50 active:bg-violet-100"
                  style={{ minHeight: 48 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-4xl mb-3">🎉</p>
              <h3 className="text-xl font-black text-[#111]">
                당신은 <span className="text-[#8B5CF6]">{typeLabels[resultType]}</span> 타입!
              </h3>
              <p className="mt-2 text-sm text-[#555]">{typeDescriptions[resultType]}</p>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm font-bold text-[#111]">추천 장소</p>
              {recommendations.map(v => (
                <Link
                  key={v.id}
                  to={getCategoryHref(v.category, v.slug, v.region)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-all hover:border-[#8B5CF6]"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-[#8B5CF6]">
                    {v.nameKo.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111] truncate">{v.nameKo}</p>
                    <p className="text-xs text-[#555]">{v.regionKo}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 rounded-xl border-2 border-[#8B5CF6] py-3 text-sm font-bold text-[#8B5CF6] transition-all hover:bg-violet-50"
                style={{ minHeight: 48 }}
              >
                다시 하기
              </button>
              <button
                onClick={() => {
                  const text = `나는 ${typeLabels[resultType]} 타입! 놀쿨에서 확인해보세요`;
                  if (navigator.share) {
                    navigator.share({ text, url: window.location.origin + '/quiz' });
                  }
                }}
                className="flex-1 rounded-xl bg-[#8B5CF6] py-3 text-sm font-bold text-white transition-all hover:bg-[#7C3AED]"
                style={{ minHeight: 48 }}
              >
                결과 공유하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
