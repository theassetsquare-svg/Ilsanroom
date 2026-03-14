'use client';

import { useState } from 'react';
import OwnerReply from './OwnerReply';

interface ReviewData {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  helpful: number;
  ownerReply?: {
    reply: string;
    repliedAt: string;
  };
}

interface ReviewSectionProps {
  venueId: string;
  venueName: string;
  initialReviews?: ReviewData[];
}

const mockReviews: ReviewData[] = [
  {
    id: 'r1',
    author: '김**',
    rating: 5,
    content: '분위기도 좋고 서비스도 최고였습니다. 다음에 또 방문하고 싶어요.',
    date: '2026-03-10',
    helpful: 12,
    ownerReply: {
      reply: '소중한 후기 감사합니다! 더 좋은 서비스로 보답하겠습니다. 다음 방문을 기다리겠습니다.',
      repliedAt: '2026-03-11',
    },
  },
  {
    id: 'r2',
    author: '이**',
    rating: 4,
    content: '전체적으로 만족스러웠습니다. 음료 가격이 조금 비싼 편이지만 분위기로 충분히 커버됩니다.',
    date: '2026-03-05',
    helpful: 8,
  },
  {
    id: 'r3',
    author: '박**',
    rating: 5,
    content: '접대 자리로 이용했는데 상대방도 매우 만족해했습니다. 프라이빗한 공간이 좋았어요.',
    date: '2026-02-28',
    helpful: 15,
    ownerReply: {
      reply: '비즈니스 모임에 도움이 되었다니 기쁩니다. 다음에도 최상의 경험을 제공하겠습니다.',
      repliedAt: '2026-03-01',
    },
  },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`h-4 w-4 ${s <= rating ? 'text-amber-400' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewSection({ venueId, venueName, initialReviews }: ReviewSectionProps) {
  const reviews = initialReviews || mockReviews;
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  const toggleHelpful = (id: string) => {
    setHelpfulClicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">리뷰 ({reviews.length})</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-sm font-bold text-neutral-400">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-300">{review.author}</span>
                  <span className="ml-2 text-xs text-neutral-600">{review.date}</span>
                </div>
              </div>
              <StarDisplay rating={review.rating} />
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">{review.content}</p>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => toggleHelpful(review.id)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition ${
                  helpfulClicked.has(review.id)
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                👍 도움됨 {review.helpful + (helpfulClicked.has(review.id) ? 1 : 0)}
              </button>
            </div>

            {review.ownerReply && (
              <OwnerReply
                reply={review.ownerReply.reply}
                repliedAt={review.ownerReply.repliedAt}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
