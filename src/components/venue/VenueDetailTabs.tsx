'use client';

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

const TABS = ['기본정보', '가격표', '메뉴·서비스', '리뷰', '사진갤러리', '이벤트', 'FAQ', '지도'] as const;

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
              <h2 className="mb-3 text-xl font-bold text-neon-text">{venue.nameKo} 소개</h2>
              <p className="leading-relaxed text-neon-text-muted">{venue.description}</p>
            </div>
            {venue.features.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-bold text-neon-text">{venue.nameKo} 특징</h3>
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
              <h3 className="mb-4 font-bold text-neon-text">{venue.nameKo} 기본 정보</h3>
              <dl className="space-y-3 text-sm">
                {venue.address && <div><dt className="text-neon-text-muted/60">위치</dt><dd className="text-neon-text">{venue.address}</dd></div>}
                {venue.openHours && <div><dt className="text-neon-text-muted/60">영업시간</dt><dd className="text-neon-text">{venue.openHours}</dd></div>}
                {venue.ageGroup && <div><dt className="text-neon-text-muted/60">연령대</dt><dd className="text-neon-text">{venue.ageGroup}</dd></div>}
                {venue.dressCode && <div><dt className="text-neon-text-muted/60">드레스코드</dt><dd className="text-neon-text">{venue.dressCode}</dd></div>}
                {venue.parking && <div><dt className="text-neon-text-muted/60">주차</dt><dd className="text-neon-text">{venue.parking}</dd></div>}
                {venue.nearbyStation && <div><dt className="text-neon-text-muted/60">가까운 역</dt><dd className="text-neon-text">{venue.nearbyStation}</dd></div>}
                {venue.bestTime && <div><dt className="text-neon-text-muted/60">추천 방문 시간</dt><dd className="text-neon-text">{venue.bestTime}</dd></div>}
                <div><dt className="text-neon-text-muted/60">카테고리</dt><dd className="text-neon-text">{categoryLabel}</dd></div>
                <div><dt className="text-neon-text-muted/60">지역</dt><dd className="text-neon-text">{venue.regionKo}</dd></div>
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

        {/* ── 가격표 ── */}
        {activeTab === '가격표' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">{venue.nameKo} 가격 안내</h2>
            {(venue.priceEntry || venue.priceTable || venue.priceDrink) ? (
              <div className="overflow-hidden rounded-xl border border-neon-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neon-border bg-neon-surface-2">
                      <th className="px-4 py-3 text-left font-semibold text-neon-text">항목</th>
                      <th className="px-4 py-3 text-left font-semibold text-neon-text">가격</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venue.priceEntry && (
                      <tr className="border-b border-neon-border/50">
                        <td className="px-4 py-3 text-neon-text-muted">입장료</td>
                        <td className="px-4 py-3 text-neon-text">{venue.priceEntry}</td>
                      </tr>
                    )}
                    {venue.priceTable && (
                      <tr className="border-b border-neon-border/50">
                        <td className="px-4 py-3 text-neon-text-muted">테이블/룸</td>
                        <td className="px-4 py-3 text-neon-text">{venue.priceTable}</td>
                      </tr>
                    )}
                    {venue.priceDrink && (
                      <tr>
                        <td className="px-4 py-3 text-neon-text-muted">음료/주류</td>
                        <td className="px-4 py-3 text-neon-text">{venue.priceDrink}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-neon-text-muted">가격 정보가 등록되지 않았습니다. 업소에 직접 문의해 주세요.</p>
            )}
            <p className="mt-4 text-xs text-neon-text-muted/60">※ 가격은 변동될 수 있으며, 정확한 금액은 업소에 직접 확인하시기 바랍니다.</p>
          </div>
        )}

        {/* ── 메뉴·서비스 ── */}
        {activeTab === '메뉴·서비스' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">{venue.nameKo} 서비스</h2>
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
            <h2 className="mb-4 text-xl font-bold text-neon-text">{venue.nameKo} 리뷰</h2>
            {/* Rating distribution */}
            <div className="mb-6 rounded-xl border border-neon-border bg-neon-surface p-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-neon-text">{venue.rating.toFixed(1)}</p>
                  <p className="text-neon-gold text-sm">{'★'.repeat(Math.round(venue.rating))}</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-3 text-xs text-neon-text-muted">{star}</span>
                      <div className="h-2 flex-1 rounded-full bg-neon-surface-2">
                        <div className="h-2 rounded-full bg-neon-gold" style={{ width: `${star === Math.round(venue.rating) ? 60 : star === Math.round(venue.rating) - 1 ? 25 : 5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-neon-text-muted">리뷰 작성 기능은 곧 오픈 예정입니다.</p>
          </div>
        )}

        {/* ── 사진갤러리 ── */}
        {activeTab === '사진갤러리' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">{venue.nameKo} 사진</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-xl border border-neon-border bg-neon-surface-2 flex items-center justify-center">
                  <span className="text-neon-text-muted/30 text-sm">사진 준비중</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 이벤트 ── */}
        {activeTab === '이벤트' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-neon-text">{venue.nameKo} 이벤트</h2>
            <p className="text-neon-text-muted">현재 진행 중인 이벤트가 없습니다.</p>
          </div>
        )}

        {/* ── FAQ ── */}
        {activeTab === 'FAQ' && (
          <div>
            <h2 className="mb-6 text-xl font-bold text-neon-text">{venue.nameKo} 자주 묻는 질문</h2>
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
            <h2 className="mb-4 text-xl font-bold text-neon-text">{venue.nameKo} 위치</h2>
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
      </div>
    </div>
  );
}
