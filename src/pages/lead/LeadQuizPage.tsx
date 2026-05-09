import { useState, useCallback } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { captureLead, isValidEmail } from '@/lib/growth-engine';
import { getPopularVenues } from '@/data/venues';

interface QuizAnswer {
  companion: string;
  vibe: string;
  budget: string;
}

const QUESTIONS = [
  {
    id: 'companion',
    question: '누구와 함께 가시나요?',
    options: [
      { value: 'solo', label: '혼자', icon: '🧍', desc: '나만의 시간' },
      { value: 'friends', label: '친구들', icon: '👫', desc: '2~4명' },
      { value: 'group', label: '단체', icon: '🎉', desc: '5명 이상' },
    ],
  },
  {
    id: 'vibe',
    question: '어떤 분위기를 원하시나요?',
    options: [
      { value: 'calm', label: '조용한 대화', icon: '🍷', desc: '라운지/와인바' },
      { value: 'moderate', label: '적당한 활기', icon: '🎵', desc: '펍/이자카야' },
      { value: 'loud', label: '시끄러운 파티', icon: '🔊', desc: '클럽/나이트' },
    ],
  },
  {
    id: 'budget',
    question: '원하는 무드 강도는?',
    options: [
      { value: 'low', label: '캐주얼', icon: '☕', desc: '편하게 한잔' },
      { value: 'mid', label: '밸런스', icon: '🍷', desc: '적당한 퀄리티' },
      { value: 'high', label: '프리미엄', icon: '👑', desc: '격이 다른 무드' },
    ],
  },
] as const;

function getRecommendation(answers: QuizAnswer) {
  const venues = getPopularVenues(50);
  const categoryMap: Record<string, string[]> = {
    calm: ['lounge', 'bar'],
    moderate: ['pub', 'room', 'yojeong'],
    loud: ['club', 'night'],
  };
  const categories = categoryMap[answers.vibe] || ['club', 'night'];

  let filtered = venues.filter((v) => categories.includes(v.category));
  if (filtered.length < 3) filtered = venues.slice(0, 6);

  const typeLabel =
    answers.vibe === 'calm' ? '라운지 타입' :
    answers.vibe === 'moderate' ? '소셜 타입' : '파티 타입';

  const budgetLabel =
    answers.budget === 'low' ? '캐주얼파' :
    answers.budget === 'mid' ? '밸런스파' : '프리미엄파';

  const companionLabel =
    answers.companion === 'solo' ? '솔로 탐험가' :
    answers.companion === 'friends' ? '친구 모임러' : '단체 주최자';

  return {
    type: `${typeLabel} × ${budgetLabel}`,
    subtitle: companionLabel,
    venues: filtered.slice(0, 3),
    description:
      answers.vibe === 'calm'
        ? '조용한 대화와 분위기 있는 공간을 선호하시는군요. 프라이빗한 라운지나 칵테일바가 딱 맞습니다. 예약하고 가면 대기 없이 바로 입장 가능한 곳들을 추천드립니다.'
        : answers.vibe === 'moderate'
        ? '적당한 활기 속에서 즐기는 타입이시네요. 음악은 있지만 대화가 되는 곳, 안주가 맛있는 곳 위주로 추천드립니다. 자리 옮기지 않고 한 곳에서 해결되는 곳들이에요.'
        : '에너지 넘치는 밤을 즐기시는 분이군요! 사운드 시스템 좋고, DJ 라인업 탄탄한 곳 위주로 추천드립니다. 금토 자정 이후가 피크타임이에요.',
  };
}

export default function LeadQuizPage() {
  useDocumentMeta(
    '3문제로 찾는 나만의 밤 — 맞춤 추천 퀴즈',
    '3가지 질문으로 나한테 딱 맞는 서울 경기 나이트라이프 장소를 찾아드립니다. 취향 맞춤 추천 퀴즈.'
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswer>>({});
  const [showResult, setShowResult] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = useCallback((questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  }, [answers, step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;
    setLoading(true);
    await captureLead({
      email,
      source: 'quiz',
      quizAnswers: answers as Record<string, string>,
    });
    setEmailSubmitted(true);
    setLoading(false);
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
    setEmailSubmitted(false);
    setEmail('');
  };

  // Result screen
  if (showResult) {
    const result = getRecommendation(answers as QuizAnswer);

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-neon-primary to-purple-700 p-6 text-center text-white">
          <p className="mb-1 text-sm opacity-80">당신의 밤 유형은</p>
          <h1 className="mb-1 text-3xl font-bold">{result.type}</h1>
          <p className="text-lg opacity-90">{result.subtitle}</p>
        </div>

        <p className="mb-6 text-center leading-relaxed text-neon-muted">{result.description}</p>

        <h2 className="mb-4 text-xl font-bold">맞춤 추천 장소</h2>
        <div className="mb-8 space-y-3">
          {result.venues.map((v) => (
            <a
              key={v.slug}
              href={`/${v.category === 'club' ? 'clubs' : v.category === 'night' ? 'nights' : v.category === 'lounge' ? 'lounges' : v.category === 'room' ? 'rooms' : v.category}/${v.region ? v.region + '/' : ''}${v.slug}`}
              className="block rounded-xl border border-neon-border bg-neon-surface p-4 transition hover:border-neon-primary/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{v.nameKo || v.name}</h3>
                  <p className="text-sm text-neon-muted">{v.regionKo} · {v.category}</p>
                </div>
                <span className="text-neon-primary">→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Email capture */}
        {!emailSubmitted ? (
          <div className="rounded-2xl border border-neon-primary/20 bg-neon-surface p-6">
            <h3 className="mb-2 text-center font-bold">맞춤 추천 알림 받기</h3>
            <p className="mb-4 text-center text-sm text-neon-muted">
              취향에 맞는 큐레이션이 새로 준비되면 이메일로 안내드립니다. 발송 일정은 미리 약속하지 않습니다.
            </p>
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-4 py-3 text-base outline-none focus:border-neon-primary"
              />
              <button
                type="submit"
                disabled={loading}
                className="whitespace-nowrap rounded-lg bg-neon-primary px-4 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '...' : '받기'}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-green-500/20 bg-green-50 p-6 text-center">
            <p className="text-lg font-bold text-green-800">구독 완료!</p>
            <p className="text-sm text-green-700">맞춤 추천이 준비되는 대로 이메일로 안내드립니다.</p>
          </div>
        )}

        {/* Share + restart */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              const text = `나는 "${result.type}" 타입이래! 너는 어떤 타입? 테스트 해봐 →`;
              const url = window.location.origin + '/lead/quiz';
              if (navigator.share) {
                navigator.share({ title: '나만의 밤 유형 퀴즈', text, url });
              } else {
                navigator.clipboard.writeText(`${text} ${url}`);
              }
            }}
            className="rounded-lg border border-neon-primary px-6 py-3 font-bold text-neon-primary transition hover:bg-neon-primary/5"
          >
            친구에게 퀴즈 공유하기
          </button>
          <button onClick={restart} className="text-sm text-neon-muted hover:underline">
            다시 하기
          </button>
        </div>
      </div>
    );
  }

  // Quiz questions
  const currentQ = QUESTIONS[step];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm text-neon-muted">
          <span>질문 {step + 1} / {QUESTIONS.length}</span>
          <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neon-border">
          <div
            className="h-full rounded-full bg-neon-primary transition-all duration-500"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="mb-8 text-center text-2xl font-bold md:text-3xl">
        {currentQ.question}
      </h1>

      <div className="space-y-3">
        {currentQ.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(currentQ.id, opt.value)}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
              answers[currentQ.id as keyof QuizAnswer] === opt.value
                ? 'border-neon-primary bg-neon-primary/5'
                : 'border-neon-border bg-neon-surface hover:border-neon-primary/40'
            }`}
          >
            <span className="text-3xl">{opt.icon}</span>
            <div>
              <p className="font-bold">{opt.label}</p>
              <p className="text-sm text-neon-muted">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-6 text-sm text-neon-muted hover:underline"
        >
          ← 이전 질문
        </button>
      )}
    </div>
  );
}
