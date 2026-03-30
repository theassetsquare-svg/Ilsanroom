

import { useState } from 'react';
import type { Venue } from '@/types';

interface FAQ {
  question: string;
  answer: string;
}

interface VenueDetailTabsProps {
  venue: Venue;
  faqs: FAQ[];
  categoryLabel: string;
}

const TABS = ['기본정보', '메뉴·서비스', '리뷰', '사진갤러리', '이벤트', 'FAQ', '지도', 'VS투표', '인기시간'] as const;

function GalleryImage({ slug, name, num }: { slug: string; name: string; num: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className="overflow-hidden rounded-xl">
      <img
        src={`/venues/${slug}-g${num}.jpg`}
        alt={name}
        width={600}
        height={400}
        loading="eager"
        onError={() => setFailed(true)}
        className="w-full object-cover"
        style={{ aspectRatio: '3/2' }}
      />
    </div>
  );
}

const CATEGORY_SYNONYMS: Record<string, string> = {
  club: 'EDM 파티홀', night: '댄스홀', lounge: '감성 칵테일 바',
  room: '프라이빗 룸', yojeong: '전통 한정식', hoppa: '호스트 엔터테인먼트',
};

export default function VenueDetailTabs({ venue, faqs, categoryLabel }: VenueDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('기본정보');

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
              <h2 className="mb-3 text-xl font-bold text-neon-text">소개</h2>
              <p className="leading-relaxed text-neon-text-muted">
                {venue.description.slice(0, 100).includes(venue.nameKo)
                  ? venue.description
                  : `${venue.nameKo} — ${venue.description}`}
              </p>
            </div>
            {venue.features.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-bold text-neon-text">주요 특징</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {venue.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-neon-text-muted">
                      <span className="text-neon-primary">●</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            {venue.atmosphere.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-bold text-neon-text">분위기</h3>
                <div className="flex flex-wrap gap-2">
                  {venue.atmosphere.map((a) => (
                    <span key={a} className="rounded-full border border-neon-border bg-neon-surface-2 px-3 py-1 text-sm text-neon-text-muted">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 메뉴·서비스 ── */}
        {activeTab === '메뉴·서비스' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">서비스 안내</h2>
            {venue.features.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {venue.features.map((f) => (
                  <div key={f} className="flex items-center gap-3 rounded-xl border border-neon-border bg-neon-surface p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-primary/10 text-neon-primary text-sm">✓</span>
                    <span className="text-sm text-neon-text">{f}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neon-text-muted">서비스 정보가 등록되지 않았습니다.</p>
            )}
          </div>
        )}

        {/* ── 리뷰 ── */}
        {activeTab === '리뷰' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">방문 리뷰</h2>
            <div className="rounded-xl border border-neon-border bg-neon-surface p-6 text-center">
              <p className="mb-2 text-neon-text-muted">아직 등록된 리뷰가 없습니다.</p>
              <p className="text-sm text-neon-text-subtle">리뷰 작성 기능은 곧 오픈 예정입니다.</p>
            </div>
          </div>
        )}

        {/* ── 사진갤러리 ── */}
        {activeTab === '사진갤러리' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">사진 갤러리</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <GalleryImage key={n} slug={venue.slug} name={venue.nameKo} num={n} />
              ))}
            </div>
          </div>
        )}

        {/* ── 이벤트 ── */}
        {activeTab === '이벤트' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">이벤트</h2>
            <p className="text-neon-text-muted">현재 진행 중인 이벤트가 없습니다.</p>
          </div>
        )}

        {/* ── FAQ ── */}
        {activeTab === 'FAQ' && (
          <div>
            <h2 className="mb-6 text-xl font-bold text-neon-text">자주 묻는 질문</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-neon-border bg-neon-surface p-5">
                  <h3 className="mb-2 font-semibold text-neon-text">Q. {faq.question}</h3>
                  <p className="text-sm leading-relaxed text-neon-text-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 지도 ── */}
        {activeTab === '지도' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">위치 안내</h2>
            {venue.address ? (
              <div>
                <div className="mb-4 rounded-xl border border-neon-border bg-neon-surface-2 p-8 text-center" style={{ minHeight: '300px' }}>
                  <p className="text-neon-text-muted mb-4">{venue.address}</p>
                  <a
                    href={`https://map.kakao.com/?q=${encodeURIComponent(venue.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-[#FDD700]"
                  >
                    카카오맵에서 보기
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-neon-text-muted">주소 정보가 등록되지 않았습니다.</p>
            )}
          </div>
        )}
        {/* ── VS투표 ── */}
        {activeTab === 'VS투표' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">VS 대결</h2>
            <p className="mb-6 text-sm text-neon-text-muted">이 {CATEGORY_SYNONYMS[venue.category] || '업소'}와 비슷한 곳, 어디가 더 좋을까?</p>
            <div className="rounded-xl border border-neon-pink/30 bg-neon-bg p-6 text-center">
              <p className="text-sm text-neon-text-muted mb-4">VS 투표는 메인 페이지에서 해볼 수 있어요.</p>
              <a href="/vs" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-neon-pink/20 px-5 py-2.5 text-sm font-medium text-neon-pink transition hover:bg-neon-pink/30">
                VS 투표 참여하기 →
              </a>
            </div>
          </div>
        )}

        {/* ── 인기시간 ── */}
        {activeTab === '인기시간' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">인기 요일·시간대</h2>
            <div className="space-y-3">
              {[
                { day: '금요일', time: '22:00~02:00', level: 95, label: '최고 인기' },
                { day: '토요일', time: '22:00~03:00', level: 100, label: '최고 인기' },
                { day: '목요일', time: '21:00~01:00', level: 60, label: '보통' },
                { day: '수요일', time: '20:00~00:00', level: 35, label: '여유' },
                { day: '일요일', time: '20:00~00:00', level: 45, label: '보통' },
              ].map((slot) => (
                <div key={slot.day} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium text-neon-text">{slot.day}</span>
                  <div className="h-3 flex-1 rounded-full bg-neon-surface-2">
                    <div className={`h-3 rounded-full transition-all ${slot.level >= 80 ? 'bg-neon-pink' : slot.level >= 50 ? 'bg-neon-gold' : 'bg-neon-green'}`}
                      style={{ width: `${slot.level}%` }} />
                  </div>
                  <span className="w-20 text-right text-xs text-neon-text-muted">{slot.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-neon-text-subtle">※ 시간대별 인기도는 참고용이며, 실제 혼잡도와 다를 수 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
