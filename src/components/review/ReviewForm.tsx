import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { submitReview, uploadReviewImage } from '@/lib/review-api';

interface Props {
  venueId: string;
  venueName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ venueId, venueName, onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-6 text-center">
        <p className="text-neon-text-muted mb-3">후기를 작성하려면 로그인이 필요해요</p>
        <a href="/login" className="inline-block rounded-lg bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700 transition">
          로그인하기
        </a>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 10) {
      setError('사진은 최대 10장까지 업로드 가능합니다');
      return;
    }
    setUploading(true);
    setError('');
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB 이하만 가능합니다');
        continue;
      }
      const result = await uploadReviewImage(file);
      if (result.url) {
        setImages(prev => [...prev, result.url!]);
      } else if (result.error) {
        setError(result.error);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError('별점을 선택해주세요'); return; }
    if (!content.trim() || content.trim().length < 20) { setError('후기는 최소 20자 이상 작성해주세요'); return; }

    setSubmitting(true);
    setError('');

    const result = await submitReview({
      venue_id: venueId,
      rating,
      title: title.trim() || undefined,
      content: content.trim(),
      images: images.length > 0 ? images : undefined,
      visit_date: visitDate || undefined,
      is_anonymous: isAnonymous,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setRating(0); setTitle(''); setContent(''); setVisitDate(''); setImages([]);
      onSuccess?.();
    }
  };

  const displayRating = hoverRating || rating;
  const ratingLabels = ['', '별로예요', '그저그래요', '괜찮아요', '좋아요', '최고예요'];

  return (
    <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5 sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-neon-text">{venueName} 후기 작성</h3>

      {/* 별점 */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-neon-text-muted">별점 *</label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <svg className={`h-8 w-8 ${s <= displayRating ? 'text-amber-400' : 'text-neutral-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <span className="text-sm font-medium text-amber-500">{ratingLabels[displayRating]}</span>
          )}
        </div>
      </div>

      {/* 제목 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-neon-text-muted">한줄 제목 (선택)</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="ex) 분위기 미쳤다, 재방문 확정"
          maxLength={50}
          className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2.5 text-sm text-neon-text placeholder:text-neon-text-muted/50 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* 본문 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-neon-text-muted">후기 내용 * (20자 이상)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="솔직한 방문 후기를 작성해주세요. 분위기, 서비스, 특이사항 등을 자유롭게..."
          rows={5}
          maxLength={2000}
          className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2.5 text-sm text-neon-text placeholder:text-neon-text-muted/50 focus:border-violet-500 focus:outline-none resize-none"
        />
        <div className="mt-1 text-right text-xs text-neon-text-muted">{content.length}/2000</div>
      </div>

      {/* 사진 업로드 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-neon-text-muted">사진 (최대 10장)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url, i) => (
            <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-neon-border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >x</button>
            </div>
          ))}
          {images.length < 10 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-neon-border text-neon-text-muted hover:border-violet-400 hover:text-violet-400 transition"
            >
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              ) : (
                <span className="text-2xl">+</span>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* 방문 날짜 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-neon-text-muted">방문 날짜 (선택)</label>
        <input
          type="date"
          value={visitDate}
          onChange={e => setVisitDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* 익명 */}
      <div className="mb-5 flex items-center gap-2">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={e => setIsAnonymous(e.target.checked)}
          className="h-4 w-4 rounded border-neon-border text-violet-600"
        />
        <label htmlFor="anonymous" className="text-sm text-neon-text-muted">익명으로 작성</label>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition"
        >
          {submitting ? '작성 중...' : '후기 등록'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg border border-neon-border px-5 py-2.5 text-sm text-neon-text-muted hover:bg-neon-surface-2 transition"
          >취소</button>
        )}
      </div>
    </div>
  );
}
