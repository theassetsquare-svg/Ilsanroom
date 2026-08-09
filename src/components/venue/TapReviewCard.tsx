import { useEffect, useState } from 'react';
import type { Venue } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { fetchReviews, submitReview } from '@/lib/review-api';
import InlineJoinCard from '@/components/auth/InlineJoinCard';
import FoundingMemberReward from '@/components/community/FoundingMemberReward';

/**
 * 탭 후기 (파트4.5) — 타이핑 0. 손가락 탭으로만 항목을 고르면 한 줄 후기로 조립,
 * "본인 확인 화면" 뒤 그 회원 user_id 로 reviews 테이블에 실제 등록(익명 닉네임).
 *
 * ★정직/게이트: 기계가 회원인 척 쓰는 게 아니라, 실회원이 직접 고른 선택을 요약해 본인이 등록한다.
 *   user_id 세팅 + likes/upvote 0 → 가짜 UGC 게이트(user_id NULL·likes>=2) 자연 통과.
 *   계정당 업소당 1회(기존 후기 있으면 잠금) · 신고/수정은 기존 리뷰 목록 흐름 유지.
 */
const GROUPS = [
  { key: 'mood', label: '분위기는', required: true, opts: ['조용한 편', '적당히 북적', '신나는 분위기'] },
  { key: 'when', label: '언제 갔냐면', required: false, opts: ['평일 저녁', '주말', '늦은 밤'] },
  { key: 'who', label: '누구랑', required: false, opts: ['친구랑', '연인이랑', '혼자', '일행이랑'] },
  { key: 'feel', label: '한 줄 느낌', required: true, opts: ['또 갈 듯', '괜찮았음', '무난했음'] },
] as const;

type Picks = Partial<Record<'mood' | 'when' | 'who' | 'feel', string>>;

function assemble(p: Picks): string {
  const parts: string[] = [];
  if (p.who) parts.push(p.who);
  parts.push(p.mood ? `${p.mood} 분위기였어요` : '다녀왔어요');
  const tail: string[] = [];
  if (p.when) tail.push(`${p.when}에 갔고`);
  if (p.feel) tail.push(`${p.feel}`);
  const first = parts.join(' ');
  return tail.length ? `${first}. ${tail.join(' ')}.` : `${first}.`;
}

export default function TapReviewCard({ venue, onSubmitted }: { venue: Venue; onSubmitted?: () => void }) {
  const { user } = useAuth();
  const [alreadyMine, setAlreadyMine] = useState<boolean | null>(null);
  const [picks, setPicks] = useState<Picks>({});
  const [rating, setRating] = useState(0);
  const [step, setStep] = useState<'pick' | 'confirm' | 'done'>('pick');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reward, setReward] = useState(false);

  useEffect(() => {
    if (!user) { setAlreadyMine(false); return; }
    let alive = true;
    fetchReviews(venue.slug, 50).then(({ data }) => {
      if (!alive) return;
      setAlreadyMine(data.some(r => r.user_id === user.id));
    });
    return () => { alive = false; };
  }, [user, venue.slug]);

  const pick = (g: string, v: string) => setPicks(p => ({ ...p, [g]: p[g as keyof Picks] === v ? undefined : v }));
  const ready = rating > 0 && !!picks.mood && !!picks.feel;

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setErr(null);
    const res = await submitReview({
      venue_id: venue.slug,
      rating,
      content: assemble(picks),
      is_anonymous: true,
    });
    setSubmitting(false);
    if (res.error) { setErr(res.error); return; }
    setStep('done');
    setReward(true);
    onSubmitted?.();
  };

  // 비회원 — 팝업 아닌 인라인 1초 가입 (익명 보장 1줄)
  if (!user) {
    return (
      <div className="mb-5">
        <p className="mb-2 text-sm font-bold" style={{ color: '#111' }}>다녀오셨나요? 30초면 됩니다 — 타이핑 없이 탭만</p>
        <InlineJoinCard context="tapreview" />
      </div>
    );
  }

  if (alreadyMine === null) return null;

  if (alreadyMine || step === 'done') {
    return (
      <>
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>🙌 후기 감사합니다</p>
          <p className="mt-1 text-xs" style={{ color: '#999' }}>아래 목록에서 확인·수정할 수 있어요. 계정당 한 곳에 한 번이에요.</p>
        </div>
        <FoundingMemberReward show={reward} onClose={() => setReward(false)} />
      </>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border-2 border-[#EDE9FE] bg-white p-5">
      <p className="text-sm font-bold" style={{ color: '#111' }}>다녀오셨나요? 30초면 됩니다</p>
      <p className="mt-0.5 text-xs" style={{ color: '#999' }}>타이핑 없이 탭만 — 익명 닉네임으로 올라가요</p>

      {step === 'pick' && (
        <>
          {/* 별점 1탭 */}
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-bold" style={{ color: '#555' }}>별점</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-3xl transition active:scale-110" style={{ color: s <= rating ? '#B45309' : '#D1D5DB', minHeight: 44, minWidth: 44 }}>★</button>
              ))}
            </div>
          </div>
          {GROUPS.map(g => (
            <div key={g.key} className="mt-4">
              <p className="mb-1.5 text-xs font-bold" style={{ color: '#555' }}>{g.label}{g.required && <span style={{ color: '#8B5CF6' }}> *</span>}</p>
              <div className="flex flex-wrap gap-2">
                {g.opts.map(o => {
                  const on = picks[g.key as keyof Picks] === o;
                  return (
                    <button
                      key={o}
                      onClick={() => pick(g.key, o)}
                      className={`rounded-full border-2 px-3.5 text-sm font-medium transition active:scale-[0.97] ${on ? 'border-[#8B5CF6] bg-[#F6F4FF] text-[#6D28D9]' : 'border-gray-200 bg-white text-[#555]'}`}
                      style={{ minHeight: 44 }}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={() => setStep('confirm')}
            disabled={!ready}
            className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-30"
            style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
          >
            {ready ? '이대로 확인하기 →' : '별점 + 분위기 + 느낌을 골라주세요'}
          </button>
        </>
      )}

      {step === 'confirm' && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold" style={{ color: '#555' }}>이 내용으로 내 후기로 올릴게요 (본인 확인)</p>
          <div className="rounded-xl bg-[#F9FAFB] p-4">
            <p className="text-lg tracking-wider" style={{ color: '#B45309' }}>{'★'.repeat(rating)}<span style={{ color: '#D1D5DB' }}>{'★'.repeat(5 - rating)}</span></p>
            <p className="mt-1.5 text-sm" style={{ color: '#333', lineHeight: '1.7' }}>{assemble(picks)}</p>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: '#999' }}>익명 닉네임으로 게시 · 본명 노출 X · 나중에 수정·삭제 가능</p>
          {err && <p className="mt-2 text-xs" style={{ color: '#EF4444' }}>{err}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={() => setStep('pick')} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold" style={{ color: '#555', minHeight: 48 }}>다시 고르기</button>
            <button onClick={submit} disabled={submitting} className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-40" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>
              {submitting ? '올리는 중...' : '내 후기로 등록'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
