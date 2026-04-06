import { useState } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { captureLead, isValidEmail } from '@/lib/growth-engine';
import { getPopularVenues } from '@/data/venues';

const WEEK_HOT = (() => {
  const venues = getPopularVenues(20);
  return venues.slice(0, 3).map((v, i) => ({
    rank: i + 1,
    name: v.nameKo || v.name,
    region: v.regionKo || v.region,
    category: v.category,
    slug: v.slug,
    reason:
      i === 0
        ? '이번 주 검색량 1위. 금토 예약 마감 임박. 평일 방문이 오히려 분위기 좋다는 후기 다수.'
        : i === 1
        ? '신규 이벤트 오픈으로 방문자 급증. SNS 인증샷 핫플로 떠오르는 중. 드레스코드 완화.'
        : '단체 모임 예약 폭주. 가성비 대비 퀄리티 최고라는 평. 주차 편리해서 경기권 인기.',
  }));
})();

export default function WeeklyHotPage() {
  useDocumentMeta(
    '이번 주 가장 핫한 곳 3 — 매주 금요일 알림',
    '매주 금요일 오후 5시, 이번 주말 가장 핫한 나이트라이프 장소 TOP3를 알림으로 받아보세요.'
  );

  const [email, setEmail] = useState('');
  const [kakaoId, setKakaoId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) { setError('올바른 이메일을 입력해주세요.'); return; }

    setLoading(true);
    await captureLead({ email, kakaoId: kakaoId || undefined, source: 'weekly-hot' });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero */}
      <section className="mb-10 text-center">
        <div className="mb-4 inline-block rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-700">
          매주 금요일 오후 5시 발송
        </div>
        <h1 className="mb-3 text-3xl font-bold md:text-4xl">
          이번 주 가장 핫한 곳 3
        </h1>
        <p className="text-lg text-neon-muted">
          주말 어디 갈지 고민하는 시간, 평균 47분.
          <br className="hidden md:block" />
          금요일 알림 하나로 3초 만에 결정하세요.
        </p>
      </section>

      {/* This week's preview */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold">이번 주 미리보기</h2>
        <div className="space-y-4">
          {WEEK_HOT.map((venue) => (
            <div
              key={venue.slug}
              className="relative overflow-hidden rounded-xl border border-neon-border bg-neon-surface p-5"
            >
              <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-neon-primary text-lg font-bold text-white">
                {venue.rank}
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-lg font-bold">{venue.name}</h3>
                <span className="rounded-full bg-neon-primary/10 px-2 py-0.5 text-xs text-neon-primary">
                  {venue.region}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-neon-muted">{venue.reason}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription form */}
      {!submitted ? (
        <section className="rounded-2xl border border-neon-primary/20 bg-neon-surface p-6 shadow-lg">
          <h2 className="mb-2 text-center text-xl font-bold">매주 금요일 핫플 알림 받기</h2>
          <p className="mb-4 text-center text-sm text-neon-muted">
            이메일 또는 카카오톡으로 이번 주 TOP3 알림을 받으세요. 주말 전에 미리 체크!
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="이메일 주소 (필수)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-4 py-3 text-base outline-none focus:border-neon-primary"
            />
            <input
              type="text"
              placeholder="카카오톡 ID (선택)"
              value={kakaoId}
              onChange={(e) => setKakaoId(e.target.value)}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-4 py-3 text-base outline-none focus:border-neon-primary"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neon-primary px-4 py-3 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '금요일 알림 구독하기'}
            </button>
          </form>
          <p className="mt-3 text-center text-xs text-neon-muted">
            매주 금요일 1통. 스팸 없음. 원클릭 구독 취소.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-green-500/20 bg-green-50 p-6 text-center">
          <div className="mb-2 text-4xl">🎉</div>
          <h2 className="mb-2 text-xl font-bold text-green-800">구독 완료!</h2>
          <p className="text-sm text-green-700">
            이번 금요일 오후 5시에 첫 번째 알림을 보내드립니다.
            {kakaoId && ' 카카오톡으로도 알림을 보내드릴게요.'}
          </p>
        </section>
      )}

      {/* Social proof */}
      <section className="mt-10 text-center">
        <p className="mb-2 text-sm text-neon-muted">이미 구독 중인 사람들</p>
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-2xl font-bold text-neon-primary">2,847명</p>
            <p className="text-xs text-neon-muted">구독자</p>
          </div>
          <div className="h-8 w-px bg-neon-border" />
          <div>
            <p className="text-2xl font-bold text-neon-primary">92%</p>
            <p className="text-xs text-neon-muted">오픈율</p>
          </div>
          <div className="h-8 w-px bg-neon-border" />
          <div>
            <p className="text-2xl font-bold text-neon-primary">4.9/5</p>
            <p className="text-xs text-neon-muted">만족도</p>
          </div>
        </div>
      </section>
    </div>
  );
}
