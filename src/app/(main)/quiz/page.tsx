"use client";

import { useState } from "react";

interface Question {
  id: number;
  question: string;
  options: { label: string; value: string }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "금요일 밤, 당신의 이상적인 시작은?",
    options: [
      { label: "🍸 조용한 바에서 칵테일 한 잔", value: "lounge" },
      { label: "🎵 강렬한 비트가 울리는 곳으로 직행", value: "club" },
      { label: "🎤 라이브 밴드 음악을 들으며", value: "night" },
      { label: "🏮 격식 있는 자리에서 대접받으며", value: "yojeong" },
    ],
  },
  {
    id: 2,
    question: "가장 중요하게 생각하는 것은?",
    options: [
      { label: "💃 신나는 음악과 춤", value: "club" },
      { label: "🛋️ 편안한 분위기와 대화", value: "lounge" },
      { label: "👥 새로운 사람들과의 만남", value: "hoppa" },
      { label: "🎭 특별한 경험과 퍼포먼스", value: "night" },
    ],
  },
  {
    id: 3,
    question: "선호하는 음악 스타일은?",
    options: [
      { label: "🎧 EDM / 하우스 / 테크노", value: "club" },
      { label: "🎷 재즈 / 소울 / R&B", value: "lounge" },
      { label: "🎸 팝 / 록 / 라이브 밴드", value: "night" },
      { label: "🎵 트로트 / 발라드 / 가요", value: "yojeong" },
    ],
  },
  {
    id: 4,
    question: "이상적인 동행 인원은?",
    options: [
      { label: "👤 혼자서도 충분히 즐겨요", value: "lounge" },
      { label: "👥 친한 친구 2~3명과", value: "club" },
      { label: "👨‍👩‍👧‍👦 큰 그룹으로 왁자지껄", value: "night" },
      { label: "🤝 비즈니스 파트너와 함께", value: "yojeong" },
    ],
  },
];

interface Result {
  type: string;
  title: string;
  emoji: string;
  description: string;
  recommend: string;
}

const results: Record<string, Result> = {
  club: {
    type: "club",
    title: "에너자이저형 클러버",
    emoji: "🔥",
    description: "당신은 강렬한 비트와 함께 밤을 불태우는 타입! EDM과 함께 춤추는 것이 최고의 힐링인 당신에게 클럽이 딱 맞습니다.",
    recommend: "클럽을 추천합니다",
  },
  lounge: {
    type: "lounge",
    title: "감성 라운지형",
    emoji: "🍷",
    description: "분위기 있는 공간에서 좋은 음악과 칵테일을 즐기는 당신. 소란스러운 것보다 감각적인 경험을 선호하는 세련된 타입입니다.",
    recommend: "라운지를 추천합니다",
  },
  night: {
    type: "night",
    title: "소셜 나이트형",
    emoji: "🌙",
    description: "라이브 음악과 함께 사교적인 분위기를 즐기는 당신. 다양한 연령대와 어울리며 밤을 즐기는 활발한 소셜 타입입니다.",
    recommend: "나이트클럽을 추천합니다",
  },
  yojeong: {
    type: "yojeong",
    title: "격조 전통형",
    emoji: "🏮",
    description: "격식과 전통을 중시하는 품격 있는 당신. 한식과 전통 공연을 즐기며 특별한 자리를 만드는 것을 좋아하는 타입입니다.",
    recommend: "요정을 추천합니다",
  },
  hoppa: {
    type: "hoppa",
    title: "소통 엔터테이너형",
    emoji: "✨",
    description: "새로운 사람과의 만남과 대화를 즐기는 당신. 호스트와 함께 재미있는 시간을 보내는 것이 최고의 나이트라이프인 타입입니다.",
    recommend: "호빠를 추천합니다",
  },
};

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const getResult = (): Result => {
    const counts: Record<string, number> = {};
    answers.forEach((a) => {
      counts[a] = (counts[a] || 0) + 1;
    });
    const topType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "club";
    return results[topType];
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
  };

  if (showResult) {
    const result = getResult();
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16">
          <div className="mb-8 text-center">
            <div className="mb-4 text-7xl">{result.emoji}</div>
            <h1 className="mb-2 text-3xl font-bold text-violet-400">
              {result.title}
            </h1>
            <p className="text-lg text-neutral-300">{result.recommend}</p>
          </div>

          <div className="mb-8 w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
            <p className="text-base leading-relaxed text-neutral-300">
              {result.description}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetQuiz}
              className="rounded-xl bg-violet-600 px-6 py-3 font-medium transition hover:bg-violet-500"
            >
              다시 테스트하기
            </button>
            <a
              href="/"
              className="rounded-xl border border-neutral-700 px-6 py-3 font-medium transition hover:bg-neutral-900"
            >
              업소 둘러보기
            </a>
          </div>

          <div className="mt-12 w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-4 text-center text-lg font-bold">결과 공유하기</h3>
            <div className="flex justify-center gap-3">
              {["카카오톡", "인스타그램", "X(트위터)", "링크복사"].map((platform) => (
                <button
                  key={platform}
                  className="rounded-xl bg-neutral-800 px-4 py-2 text-sm text-neutral-400 transition hover:bg-neutral-700 hover:text-white"
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-3xl font-bold">
            나이트라이프 <span className="text-violet-400">성향 테스트</span>
          </h1>
          <p className="text-neutral-400">나에게 맞는 나이트라이프 유형은?</p>
        </div>

        {/* Progress */}
        <div className="mb-8 w-full">
          <div className="mb-2 flex justify-between text-sm text-neutral-500">
            <span>질문 {currentQuestion + 1} / {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8 w-full text-center">
          <h2 className="text-2xl font-bold leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Options */}
        <div className="w-full space-y-3">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-5 text-left text-lg transition-all hover:border-violet-500/50 hover:bg-neutral-800 active:scale-[0.98]"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
