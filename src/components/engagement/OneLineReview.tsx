import { useState, useRef, useEffect } from 'react';

export default function OneLineReview() {
  const [reviews, setReviews] = useState<{ id: number; text: string; author: string; venue: string; time: string }[]>([]);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { return () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current); }; }, []);

  const handleSubmit = () => {
    if (!input.trim() || input.trim().length < 5) return;
    setReviews([
      { id: Date.now(), text: input.trim(), author: '방금 작성', venue: '', time: '방금' },
      ...reviews,
    ]);
    setInput('');
    setSubmitted(true);
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    submitTimerRef.current = setTimeout(() => setSubmitted(false), 2000);
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
