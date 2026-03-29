import { useState } from 'react';

const sampleReviews = [
  { id: 1, text: '강남 금요일 밤, 여기 아니면 어디 가겠어요', author: '파티매니아', venue: '강남청담클럽 레이스', time: '2시간 전' },
  { id: 2, text: '밴드 라이브 듣고 소름 돋았다', author: '댄스왕', venue: '수원찬스돔나이트', time: '3시간 전' },
  { id: 3, text: '신실장님 서비스 진짜 최고', author: '일산단골', venue: '일산룸', time: '5시간 전' },
  { id: 4, text: '첫 방문인데 혼자 가도 전혀 어색하지 않았어요', author: '솔로탐험가', venue: '강남호빠 로얄', time: '6시간 전' },
  { id: 5, text: '한정식 코스가 이 가격에? 감동이다', author: '미식가', venue: '일산명월관요정', time: '어제' },
  { id: 6, text: '사운드 시스템 미쳤다 귀가 행복해', author: '음악인', venue: '강남청담클럽 사운드', time: '어제' },
];

export default function OneLineReview() {
  const [reviews, setReviews] = useState(sampleReviews);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || input.trim().length < 5) return;
    setReviews([
      { id: Date.now(), text: input.trim(), author: '방금 작성', venue: '', time: '방금' },
      ...reviews,
    ]);
    setInput('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <section className="mx-auto max-w-[1200px] px-4">
      <div className="rounded-2xl border border-neon-border bg-neon-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-neon-text">
          <span className="text-xl">💬</span> 한줄평
        </h2>

        {/* 입력 */}
        <div className="mb-5 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="오늘 밤 한줄로 표현하면?"
            maxLength={50}
            className="flex-1 rounded-xl border border-neon-border bg-neon-bg px-4 py-2.5 text-sm outline-none focus:border-neon-primary transition"
          />
          <button
            onClick={handleSubmit}
            className="shrink-0 rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-primary-light"
          >
            {submitted ? '등록됨!' : '등록'}
          </button>
        </div>

        {/* 한줄평 목록 */}
        <div className="space-y-2.5">
          {reviews.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-xl bg-neon-bg/50 px-4 py-3">
              <span className="mt-0.5 text-lg">💬</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neon-text truncate">"{r.text}"</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-neon-text-muted">
                  <span>{r.author}</span>
                  {r.venue && <><span>·</span><span className="text-neon-primary">{r.venue}</span></>}
                  <span>·</span>
                  <span>{r.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
