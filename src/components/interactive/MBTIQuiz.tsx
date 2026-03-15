'use client';

import { useState } from 'react';
import ShareButtons from './ShareButtons';

const QUESTIONS = [
  { q: '금요일 밤, 에너지가 넘칠 때 당신은?', a: ['사람 많은 곳으로 GO!', '소수 친한 사람과 조용히'], dim: 'EI' },
  { q: '새로운 업소를 선택할 때 기준은?', a: ['리뷰보다 직접 가봐야 안다', '꼼꼼히 리뷰 확인 후 결정'], dim: 'SN' },
  { q: '춤을 출 때 당신은?', a: ['음악 느끼며 자유롭게', '스텝 정확하게 맞추려고 노력'], dim: 'TF' },
  { q: '밤 문화를 즐길 때 중요한 건?', a: ['새로운 사람 만나기', '함께 온 사람과 깊은 대화'], dim: 'EI' },
  { q: '음악 장르 선택은?', a: ['EDM·힙합 등 트렌디한 것', '트로트·발라드 등 익숙한 것'], dim: 'SN' },
  { q: '모임에서 당신의 역할은?', a: ['분위기 메이커', '조용히 즐기는 관찰자'], dim: 'TF' },
  { q: '완벽한 밤의 마무리는?', a: ['아침까지 달리기', '적당한 시간에 깔끔하게'], dim: 'JP' },
  { q: '여행지에서 밤 문화를 즐긴다면?', a: ['현지 핫플 무조건 도전', '안전하고 검증된 곳만'], dim: 'JP' },
];

const TYPES: Record<string, { title: string; desc: string; venues: string[] }> = {
  ESTJ: { title: '파티 총괄 매니저', desc: '체계적으로 계획을 세워 완벽한 밤을 만드는 타입. 친구들의 일정부터 장소까지 당신이 정합니다.', venues: ['클럽 레이스', '수원찬스돔나이트'] },
  ESTP: { title: '자유로운 클러버', desc: '즉흥적이고 에너지 넘치는 당신! EDM 비트에 몸을 맡기고 새벽까지 달리는 게 최고.', venues: ['클럽NB2', '클럽M2'] },
  ENFJ: { title: '분위기 메이커', desc: '함께하는 사람들을 행복하게 만드는 당신. 모두가 즐거운 밤을 보내도록 이끕니다.', venues: ['일산명월관요정', '줄리아나나이트'] },
  ENFP: { title: '모험하는 파티피플', desc: '새로운 곳을 탐험하고 다양한 사람을 만나는 걸 좋아하는 당신!', venues: ['이태원클럽와이키키유토피아', '클럽레이저'] },
  ISTJ: { title: '단골 VIP', desc: '검증된 장소를 깊게 파는 타입. 한번 마음에 들면 꾸준히 방문하는 진성 단골.', venues: ['일산룸', '강남라운지아르쥬'] },
  ISTP: { title: '쿨한 관찰자', desc: '조용히 분위기를 즐기며 음악과 술을 음미하는 타입.', venues: ['강남라운지아르쥬', '일산명월관요정'] },
  INFJ: { title: '감성 라운지족', desc: '깊은 대화와 좋은 음악이 있는 조용한 공간을 선호하는 당신.', venues: ['강남라운지아르쥬', '일산명월관요정'] },
  INFP: { title: '감성 야행성', desc: '분위기 좋은 곳에서 음악에 빠져드는 몽상가 타입.', venues: ['강남라운지아르쥬', '홍대클럽NB2'] },
};

function getType(answers: number[]): string {
  let e = 0, i = 0, s = 0, n = 0, t = 0, f = 0, j = 0, p = 0;
  answers.forEach((a, idx) => {
    const dim = QUESTIONS[idx].dim;
    if (dim === 'EI') { a === 0 ? e++ : i++; }
    if (dim === 'SN') { a === 0 ? s++ : n++; }
    if (dim === 'TF') { a === 0 ? t++ : f++; }
    if (dim === 'JP') { a === 0 ? j++ : p++; }
  });
  return (e >= i ? 'E' : 'I') + (s >= n ? 'S' : 'N') + (t >= f ? 'T' : 'F') + (j >= p ? 'J' : 'P');
}

export default function MBTIQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers, idx];
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResult(getType(newAnswers));
    }
  };

  const reset = () => { setStep(0); setAnswers([]); setResult(null); };

  if (result) {
    const type = TYPES[result] || TYPES.ENFP;
    return (
      <div className="rounded-2xl border border-neon-primary/30 bg-neon-surface p-8 text-center">
        <p className="text-sm text-neon-primary-light mb-2">당신의 밤문화 MBTI는</p>
        <h3 className="text-3xl font-extrabold text-neon-text mb-2">{result}</h3>
        <h4 className="text-xl font-bold text-neon-gold mb-4">{type.title}</h4>
        <p className="text-sm text-neon-text-muted mb-6">{type.desc}</p>
        <div className="mb-6">
          <p className="text-xs text-neon-text-muted mb-2">추천 업소</p>
          <div className="flex flex-wrap justify-center gap-2">
            {type.venues.map((v) => (
              <span key={v} className="rounded-full bg-neon-primary/10 px-3 py-1 text-sm text-neon-primary-light">{v}</span>
            ))}
          </div>
        </div>
        <ShareButtons title={`나의 밤문화 MBTI: ${result} - ${type.title}`} />
        <button onClick={reset} className="mt-4 text-sm text-neon-text-muted hover:text-neon-text">다시 하기</button>
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="rounded-2xl border border-neon-border bg-neon-surface p-8">
      <div className="mb-4 flex items-center justify-between text-sm text-neon-text-muted">
        <span>MBTI 테스트</span>
        <span>{step + 1} / {QUESTIONS.length}</span>
      </div>
      <div className="mb-2 h-1 rounded-full bg-neon-surface-2">
        <div className="h-1 rounded-full bg-neon-primary transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <h3 className="my-6 text-lg font-bold text-neon-text">{q.q}</h3>
      <div className="space-y-3">
        {q.a.map((answer, i) => (
          <button key={i} onClick={() => handleAnswer(i)}
            className="w-full rounded-xl border border-neon-border bg-neon-bg px-5 py-4 text-left text-sm text-neon-text transition-all hover:border-neon-primary/50 hover:bg-neon-surface-2">
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
}
