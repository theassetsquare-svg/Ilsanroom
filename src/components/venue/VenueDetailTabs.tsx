

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Venue } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getVenueEvent } from '@/data/venue-events';

interface FAQ {
  question: string;
  answer: string;
}

interface VenueDetailTabsProps {
  venue: Venue;
  faqs: FAQ[];
  categoryLabel: string;
}

const ALL_TABS = ['기본정보', '양주·룸', '리뷰', '이벤트'] as const;


export default function VenueDetailTabs({ venue, faqs, categoryLabel }: VenueDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('기본정보');
  const hasEvent = !!getVenueEvent(venue.slug);
  const TABS = hasEvent ? ALL_TABS : ALL_TABS.filter(t => t !== '이벤트');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-neon-border overflow-x-auto hide-scrollbar">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-neon-primary text-neon-primary'
                  : 'border-transparent text-neon-text-muted hover:text-neon-text hover:border-neon-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-8" style={{ minHeight: '400px' }}>

        {/* ── 기본정보 ── */}
        {activeTab === '기본정보' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-xl font-bold text-neon-text">{venue.nameKo} 소개</h2>
              <p className="leading-relaxed text-neon-text-muted">
                {venue.description.slice(0, 100).includes(venue.nameKo)
                  ? venue.description
                  : `${venue.nameKo} — ${venue.description}`}
              </p>
            </div>
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-6">
              <h3 className="mb-4 font-bold text-neon-text">기본 정보</h3>
              <dl className="space-y-3 text-sm">
                {venue.address && <div><dt className="text-neon-text-subtle">위치</dt><dd className="text-neon-text">{venue.address}</dd></div>}
                {venue.openHours && <div><dt className="text-neon-text-subtle">영업시간</dt><dd className="text-neon-text">{venue.openHours}</dd></div>}
                {venue.ageGroup && <div><dt className="text-neon-text-subtle">연령대</dt><dd className="text-neon-text">{venue.ageGroup}</dd></div>}
                {venue.dressCode && <div><dt className="text-neon-text-subtle">드레스코드</dt><dd className="text-neon-text">{venue.dressCode}</dd></div>}
                {venue.parking && <div><dt className="text-neon-text-subtle">주차</dt><dd className="text-neon-text">{venue.parking}</dd></div>}
                {venue.nearbyStation && <div><dt className="text-neon-text-subtle">가까운 역</dt><dd className="text-neon-text">{venue.nearbyStation}</dd></div>}
                {venue.bestTime && <div><dt className="text-neon-text-subtle">추천 방문 시간</dt><dd className="text-neon-text">{venue.bestTime}</dd></div>}
                <div><dt className="text-neon-text-subtle">지역</dt><dd className="text-neon-text">{venue.regionKo}</dd></div>
              </dl>
            </div>


            {/* FAQ — 기본정보에 접이식 통합 */}
            {faqs.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-bold text-neon-text">자주 묻는 질문</h3>
                <div className="space-y-2">
                  {faqs.slice(0, 5).map((faq, i) => (
                    <details key={i} className="rounded-xl border border-neon-border bg-neon-surface">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neon-text">Q. {faq.question}</summary>
                      <p className="px-4 pb-4 text-sm leading-relaxed text-neon-text-muted">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 양주·룸 ── */}
        {activeTab === '양주·룸' && (
          <div className="space-y-6">
            <h2 className="mb-4 text-xl font-bold text-neon-text">{venue.nameKo} 서비스 안내</h2>

            {/* 업종별 핵심 정보 카드 */}
            <div className={`grid gap-4 ${venue.category === 'night' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {/* 양주 — 모든 업종 */}
              <div className="rounded-2xl border border-neon-border bg-neon-surface p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🥃</span>
                  <h3 className="font-bold text-neon-text">{venue.category === 'lounge' ? '양주·칵테일' : '양주'}</h3>
                </div>
                <p className="text-sm text-neon-text-muted leading-relaxed">
                  {venue.liquorInfo || '매장에 직접 문의해주세요'}
                </p>
              </div>

              {/* 부스 — 나이트만 */}
              {venue.category === 'night' && (
                <div className="rounded-2xl border border-neon-border bg-neon-surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🛋️</span>
                    <h3 className="font-bold text-neon-text">부스</h3>
                  </div>
                  <p className="text-sm text-neon-text-muted leading-relaxed">
                    {venue.boothInfo || '매장에 직접 문의해주세요'}
                  </p>
                </div>
              )}

              {/* 룸 — 나이트, 룸, 요정, 호빠 */}
              {['night', 'room', 'yojeong', 'hoppa'].includes(venue.category) && (
                <div className="rounded-2xl border border-neon-border bg-neon-surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🚪</span>
                    <h3 className="font-bold text-neon-text">룸</h3>
                  </div>
                  <p className="text-sm text-neon-text-muted leading-relaxed">
                    {venue.roomInfo || '매장에 직접 문의해주세요'}
                  </p>
                </div>
              )}

              {/* 테이블·좌석 — 클럽, 라운지 */}
              {['club', 'lounge'].includes(venue.category) && (
                <div className="rounded-2xl border border-neon-border bg-neon-surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{venue.category === 'club' ? '🎧' : '🍸'}</span>
                    <h3 className="font-bold text-neon-text">{venue.category === 'club' ? '테이블·스탠딩' : '좌석'}</h3>
                  </div>
                  <p className="text-sm text-neon-text-muted leading-relaxed">
                    {venue.roomInfo || '매장에 직접 문의해주세요'}
                  </p>
                </div>
              )}
            </div>

            {venue.features.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-bold text-neon-text">추가 서비스</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {venue.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 rounded-xl border border-neon-border bg-neon-surface p-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-primary/10 text-neon-primary text-sm">✓</span>
                      <span className="text-sm text-neon-text">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 리뷰 ── */}
        {activeTab === '리뷰' && (
          <VenueReviewSection venue={venue} />
        )}


        {/* ── 이벤트 ── */}
        {activeTab === '이벤트' && (() => {
          const ev = getVenueEvent(venue.slug);
          if (!ev) {
            return (
              <div>
                <h2 className="mb-4 text-xl font-bold text-neon-text">이벤트</h2>
                <p className="text-neon-text-muted">현재 진행 중인 이벤트가 없습니다.</p>
              </div>
            );
          }
          const accentMap = {
            pink: {
              frame: 'border-pink-300/60 from-pink-50 via-rose-50 to-white',
              label: 'text-pink-700',
              headline: 'text-pink-900',
              chip: 'bg-pink-600 text-white',
              perkFrame: 'border-pink-200 bg-white/80',
              perkTitle: 'text-pink-800',
              footFrame: 'border-pink-300 bg-pink-50',
              footText: 'text-pink-900',
            },
            gold: {
              frame: 'border-amber-300/60 from-amber-50 via-yellow-50 to-white',
              label: 'text-amber-700',
              headline: 'text-amber-900',
              chip: 'bg-amber-600 text-white',
              perkFrame: 'border-amber-200 bg-white/80',
              perkTitle: 'text-amber-800',
              footFrame: 'border-amber-300 bg-amber-50',
              footText: 'text-amber-900',
            },
            cyan: {
              frame: 'border-cyan-300/60 from-cyan-50 via-sky-50 to-white',
              label: 'text-cyan-700',
              headline: 'text-cyan-900',
              chip: 'bg-cyan-600 text-white',
              perkFrame: 'border-cyan-200 bg-white/80',
              perkTitle: 'text-cyan-800',
              footFrame: 'border-cyan-300 bg-cyan-50',
              footText: 'text-cyan-900',
            },
          } as const;
          const c = accentMap[ev.accent ?? 'pink'];
          return (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${c.chip}`}>
                  LIVE · 진행중
                </span>
                <h2 className="text-xl font-bold text-neon-text">이벤트</h2>
              </div>

              <div className={`rounded-3xl border bg-gradient-to-br p-6 sm:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ${c.frame}`}>
                <p className={`mb-3 text-xs font-bold tracking-[0.25em] ${c.label}`}>SPECIAL OFFER</p>
                <h3 className={`text-2xl sm:text-3xl font-extrabold leading-snug ${c.headline}`}>
                  {ev.headline}
                </h3>
                {ev.subline && (
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-neutral-700">
                    {ev.subline}
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {ev.perks.map((perk, i) => (
                    <div key={i} className={`rounded-2xl border p-5 backdrop-blur-sm ${c.perkFrame}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none">{perk.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${c.perkTitle}`}>{perk.title}</p>
                          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-neutral-700">{perk.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {ev.footnote && (
                  <div className={`mt-6 rounded-xl border p-4 text-center text-sm font-semibold ${c.footFrame} ${c.footText}`}>
                    {ev.footnote}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

/* ── 리뷰 섹션 ── */

interface Review {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
  isMine: boolean;
}

// ── 시드 리뷰 생성 (slug 기반 결정적) ──
const SEED_REVIEW_POOL = [
  // 나이트/클럽 리뷰
  { text: '처음 가봤는데 웨이터가 자리 잡아주고 부킹까지 해줘서 어색할 틈이 없었음. 양주 서비스도 괜찮고 분위기 좋아서 다음주에 또 갈 예정', rating: 5 },
  { text: '금요일에 갔는데 사람 진짜 많았음. 부스 예약하고 가길 잘했다. 음악은 요즘 유행하는 곡 위주로 틀어줘서 좋았는데 화장실이 좀 멀었음', rating: 4 },
  { text: '친구 생일에 갔는데 분위기 최고였음. 생일 이벤트로 케이크랑 샴페인 서비스 해줬다. 직원들 친절하고 청결 상태도 괜찮았음', rating: 5 },
  { text: '주말 피크타임에 가면 웨이팅 있을 수 있음. 평일에 가면 여유롭고 서비스도 더 좋음. 양주 구성이 다양해서 선택지가 많은 편', rating: 4 },
  { text: '인테리어 리뉴얼 하고 나서 확실히 달라졌음. 조명이랑 음향 퀄리티가 올라갔고 부스도 넓어짐. 가격대는 비슷한데 만족도는 훨씬 높아졌다', rating: 5 },
  { text: '세 번째 방문인데 올 때마다 느끼는게 실장님이 단골 관리를 잘함. 전화하면 바로 자리 잡아주고 취향도 기억해줌', rating: 5 },
  { text: '솔직히 가격이 좀 있긴 한데 그만큼 퀄리티가 나옴. 처음 가는 사람한테는 부담될 수 있지만 한번 가면 왜 비싼지 이해됨', rating: 4 },
  { text: '혼자 갔는데 전혀 어색하지 않았음. 직원분이 잘 챙겨줘서 편하게 놀았다. 다만 토요일 밤에는 예약 필수', rating: 4 },
  { text: '분위기는 좋은데 환기가 좀 아쉬웠음. 그래도 음악 선곡이랑 조명은 진짜 잘함. 친구들이랑 가기 좋은 곳', rating: 3 },
  { text: '여기 단골인데 최근에 새로 온 DJ가 선곡을 기가 막히게 함. 예전보다 확실히 분위기가 좋아졌음. 강추', rating: 5 },
  { text: '접대 자리로 갔는데 룸이 깨끗하고 서비스가 좋아서 거래처에서도 만족함. 비즈니스 모임에도 적합한 곳', rating: 5 },
  { text: '토요일에 웨이팅 30분 했는데 들어가니까 그만한 가치는 있었음. 사운드 시스템이 진짜 좋고 플로어도 넓어서 답답하지 않았다', rating: 4 },
  { text: '처음 와봤는데 생각보다 편안한 분위기라 좋았음. 화려한 곳 찾는 사람한테는 좀 심심할 수도 있지만 편하게 놀기엔 딱', rating: 4 },
  { text: '여자끼리 갔는데 웨이터가 잘 챙겨줘서 불편한 상황 없었음. 화장실도 깨끗하고 동선도 편함', rating: 5 },
  { text: '양주 종류가 다양하고 가격대별로 선택지가 있어서 좋았음. 입문용으로 괜찮은 곳. 단 주말에는 미리 전화해야 됨', rating: 4 },
];

const SEED_NAMES = [
  '강남유흥러', '홍대불주먹', '분위기장인', '주말전사', '나이트초보',
  '단골손님', '첫방문후기', '새벽감성', '파티피플', '클럽마스터',
  '혼놀러', '룸매니아', '금요일밤', '주말탈출', '분위기깡패',
];

function getSeedReviews(slug: string): Review[] {
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = 3 + (hash % 3); // 3~5개
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (hash + i * 7) % SEED_REVIEW_POOL.length;
    const nameIdx = (hash + i * 13) % SEED_NAMES.length;
    const dayOffset = (hash + i * 11) % 60 + 3; // 3~62일 전
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    reviews.push({
      id: `seed-${slug}-${i}`,
      userName: SEED_NAMES[nameIdx],
      rating: SEED_REVIEW_POOL[idx].rating,
      text: SEED_REVIEW_POOL[idx].text,
      date: d.toISOString().slice(0, 10),
      isMine: false,
    });
  }
  return reviews;
}

function getStoredReviews(venueSlug: string): Review[] {
  try {
    const stored = localStorage.getItem(`reviews_${venueSlug}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveReviews(venueSlug: string, reviews: Review[]) {
  try { localStorage.setItem(`reviews_${venueSlug}`, JSON.stringify(reviews)); } catch {}
}

function VenueReviewSection({ venue }: { venue: Venue }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showWrite, setShowWrite] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    const userReviews = getStoredReviews(venue.slug);
    const seeds = getSeedReviews(venue.slug);
    // 유저 리뷰 위에, 시드 리뷰 아래
    setReviews([...userReviews, ...seeds]);
  }, [venue.slug]);

  const handleSubmit = () => {
    if (!text.trim() || !user || rating === 0) return;
    const newReview: Review = {
      id: `r-${Date.now()}`,
      userName: (user.user_metadata?.name as string) || '사용자',
      rating,
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
      isMine: true,
    };
    const userReviews = getStoredReviews(venue.slug);
    const updatedUser = [newReview, ...userReviews];
    saveReviews(venue.slug, updatedUser);
    const seeds = getSeedReviews(venue.slug);
    setReviews([...updatedUser, ...seeds]);
    setText('');
    setRating(0);
    setShowWrite(false);
  };

  const handleDelete = (id: string) => {
    const userReviews = getStoredReviews(venue.slug).filter(r => r.id !== id);
    saveReviews(venue.slug, userReviews);
    const seeds = getSeedReviews(venue.slug);
    setReviews([...userReviews, ...seeds]);
  };

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: '#111' }}>{venue.nameKo} 리뷰</h2>
        {user ? (
          <button
            onClick={() => setShowWrite(!showWrite)}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}
          >
            리뷰 쓰기
          </button>
        ) : (
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}
          >
            로그인하고 리뷰 쓰기
          </Link>
        )}
      </div>

      {/* 평균 별점 */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-4 rounded-xl p-4" style={{ backgroundColor: '#F9FAFB' }}>
          <span className="text-3xl font-black" style={{ color: '#B45309' }}>{avg}</span>
          <div>
            <div className="text-lg tracking-wider">
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ color: s <= Math.round(Number(avg)) ? '#B45309' : '#D1D5DB' }}>★</span>
              ))}
            </div>
            <p className="text-xs" style={{ color: '#999' }}>{reviews.length}개 리뷰</p>
          </div>
        </div>
      )}

      {/* 리뷰 작성 — 전체화면 */}
      {showWrite && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
            <button onClick={() => setShowWrite(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
            <h2 className="text-base font-bold" style={{ color: '#111' }}>리뷰 쓰기</h2>
            <div style={{ width: 44 }} />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
            {/* 별점 — 크게 */}
            <p className="text-sm font-bold mb-2" style={{ color: '#111' }}>별점을 선택하세요</p>
            <div className="flex gap-2 mb-4 justify-center">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-4xl transition active:scale-110" style={{ color: s <= rating ? '#B45309' : '#D1D5DB', minHeight: 48, minWidth: 48 }}>★</button>
              ))}
            </div>
            <p className="text-center text-sm mb-4" style={{ color: rating === 0 ? '#999' : '#B45309' }}>
              {rating === 0 ? '별을 탭해서 별점을 선택하세요' : rating === 1 ? '별로예요' : rating === 2 ? '그저 그래요' : rating === 3 ? '보통이에요' : rating === 4 ? '좋아요' : '최고예요!'}
            </p>

            {/* 리뷰 내용 */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="솔직한 방문 후기를 남겨주세요. 분위기, 서비스, 가격, 추천 포인트 등 자유롭게 작성해주세요."
              className="w-full border-0 text-base outline-none resize-none"
              style={{ color: '#111', lineHeight: '1.8', minHeight: '50vh' }}
              autoFocus
            />
          </div>
          <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <button onClick={handleSubmit} disabled={!text.trim() || rating === 0}
              className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 56 }}>
              리뷰 저장
            </button>
          </div>
        </div>
      )}

      {/* 리뷰 목록 */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#111' }}>{r.userName}</span>
                  <span className="text-sm tracking-wider">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ color: s <= r.rating ? '#B45309' : '#D1D5DB', fontSize: 12 }}>★</span>
                    ))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#999' }}>{r.date}</span>
                  {r.isMine && (
                    <button onClick={() => handleDelete(r.id)} className="text-xs" style={{ color: '#EF4444', minHeight: 28 }}>삭제</button>
                  )}
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#333' }}>{r.text}</p>
            </div>
          ))}
        </div>
      ) : !showWrite && (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-sm" style={{ color: '#999' }}>아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!</p>
        </div>
      )}
    </div>
  );
}
