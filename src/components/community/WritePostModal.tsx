import { useState } from 'react';
import { createPost, type PostCategory } from '@/lib/community-api';

const categoryLabels: Record<PostCategory, string> = {
  reviews: '업소 후기',
  discussion: '오늘 어디 갈까',
  party: '파티/모임',
  tips: '꿀팁',
  free: '자유게시판',
};

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCategory?: PostCategory;
  onSuccess?: () => void;
}

export default function WritePostModal({ open, onClose, defaultCategory = 'free', onSuccess }: Props) {
  const [category, setCategory] = useState<PostCategory>(defaultCategory);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [venueSlug, setVenueSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요');
      return;
    }
    setSubmitting(true);
    setError('');

    const result = await createPost({
      category,
      title: title.trim(),
      content: content.trim(),
      venue_slug: venueSlug || undefined,
      rating: category === 'reviews' && rating > 0 ? rating : undefined,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setTitle('');
      setContent('');
      setRating(0);
      setVenueSlug('');
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" style={{ color: '#111' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-neon-text">글쓰기</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-neon-text-muted hover:bg-neon-surface-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category select */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.entries(categoryLabels) as [PostCategory, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === key
                  ? 'bg-neon-primary text-white'
                  : 'border border-neon-border text-neon-text-muted hover:border-neon-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Rating for reviews */}
        {category === 'reviews' && (
          <div className="mb-4">
            <label className="text-xs text-neon-text-muted mb-1 block">별점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`text-2xl transition ${s <= rating ? 'text-amber-400' : 'text-gray-400'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="mb-3 w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          rows={6}
          className="mb-3 w-full resize-none rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary"
        />

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-neon-border py-3 text-sm font-medium text-neon-text-muted transition hover:bg-neon-surface-2">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-neon-primary py-3 text-sm font-bold text-white transition hover:bg-neon-primary-light disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
