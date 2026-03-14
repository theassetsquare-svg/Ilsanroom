'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/nights/${venue.slug}`}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <span>{venue.regionKo}</span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-500">★</span> {venue.rating}
          <span className="text-neutral-600">({venue.reviewCount})</span>
        </span>
      </div>
      <p className="text-sm text-neutral-500 line-clamp-2">{venue.shortDescription}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {venue.tags.slice(0, 3).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
      </div>
    </Card>
  );
}

export default function NightsPage() {
  const nights = getVenuesByCategory('night');
  const [activeTab, setActiveTab] = useState<'list' | 'guide'>('list');

  return (
    <div className="bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-sm font-medium tracking-wider text-blue-400">NIGHT</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">나이트</h1>
          <p className="mt-4 max-w-2xl text-neutral-400">
            라이브 밴드와 사교댄스가 어우러지는 전통 나이트클럽
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="flex gap-1 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab('list')}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list' ? 'text-blue-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            나이트 리스트
            {activeTab === 'list' && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === 'guide' ? 'text-blue-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            부킹 안내
            {activeTab === 'guide' && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-blue-500" />
            )}
          </button>
        </div>
      </section>

      {activeTab === 'list' && (
        <>
          {/* Intro Text */}
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6">
              <h2 className="mb-3 text-lg font-bold text-white">나이트클럽 문화의 이해</h2>
              <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
                <p>
                  나이트클럽은 한국 특유의 사교 문화를 기반으로 발전해온 독자적인 업종입니다.
                  1970~80년대 도심 호텔 나이트에서 출발한 이 문화는 2000년대를 거치며
                  전국적으로 확산되었고, 현재까지도 30~50대 성인 사교 모임의 중심 공간으로
                  기능합니다. 일반 클럽과 가장 큰 차이점은 라이브 밴드 공연과
                  소셜 댄스(지르박, 부르스, 왈츠 등)가 중심이라는 것이며, 이를 통해
                  자연스러운 만남과 교류가 이루어집니다.
                </p>
                <p>
                  대부분의 나이트에서는 초보자를 위한 무료 댄스 레슨을 운영하고 있어,
                  경험이 없더라도 편하게 참여할 수 있습니다. 테이블 배치와 운영 방식도
                  일반 클럽과 다른데, 자유 좌석제 또는 지정 테이블제로 나뉘며, 넓은
                  댄스홀이 중앙에 배치되는 것이 특징입니다. 전국 주요 나이트의 분위기,
                  밴드 스케줄, 연령대 분포를 확인하고 첫 방문도 자신 있게 준비하세요.
                </p>
              </div>
            </div>
          </section>

          {/* Venue Grid */}
          <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">전체 나이트 ({nights.length})</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nights.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
            </div>
            {nights.length === 0 && (
              <p className="py-20 text-center text-neutral-600">등록된 나이트가 없습니다.</p>
            )}
          </section>
        </>
      )}

      {activeTab === 'guide' && (
        <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
          <div className="space-y-6">
            {/* 부킹 안내 */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
              <h2 className="mb-6 text-2xl font-bold text-white">나이트 부킹 완벽 가이드</h2>
              <div className="space-y-6">
                <div className="rounded-xl bg-neutral-900/60 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-blue-400">부킹이란?</h3>
                  <p className="text-sm leading-relaxed text-neutral-400">
                    부킹은 나이트클럽에서 테이블 간 자연스러운 만남을 주선하는 서비스입니다.
                    웨이터가 양쪽 테이블의 동의를 받아 합석을 진행하며, 서로 마음이 맞으면
                    대화를 이어갈 수 있습니다. 강제성이 없으며 거절도 자유롭게 할 수 있습니다.
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-900/60 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-blue-400">부킹 과정</h3>
                  <div className="space-y-3">
                    {[
                      { step: '01', title: '테이블 착석', desc: '입장 후 안내에 따라 테이블에 착석합니다.' },
                      { step: '02', title: '웨이터 요청', desc: '담당 웨이터에게 부킹 의사를 전달합니다.' },
                      { step: '03', title: '상대 확인', desc: '웨이터가 상대 테이블의 동의를 확인합니다.' },
                      { step: '04', title: '합석 진행', desc: '양쪽 모두 동의하면 합석이 이루어집니다.' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                          {item.step}
                        </span>
                        <div>
                          <p className="font-medium text-white">{item.title}</p>
                          <p className="text-sm text-neutral-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-900/60 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-blue-400">부킹 에티켓</h3>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-blue-400">•</span>
                      상대방이 거절하면 깔끔하게 수용하세요
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-blue-400">•</span>
                      첫 만남에서 과도한 스킨십은 삼가세요
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-blue-400">•</span>
                      깔끔한 복장과 청결한 외모로 좋은 인상을 남기세요
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-blue-400">•</span>
                      웨이터에게 감사의 표현(팁)을 하면 더 좋은 매칭을 기대할 수 있습니다
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-blue-400">•</span>
                      과음을 삼가고, 즐거운 분위기 유지에 협조하세요
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl bg-neutral-900/60 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-blue-400">첫 방문 체크리스트</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      '신분증 지참 (필수)',
                      '드레스코드 확인',
                      '예산 설정 (입장료+주류)',
                      '교통편 미리 확인',
                      '동행 인원 맞추기 (2~4명 권장)',
                      '업소별 연령대 사전 확인',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-lg bg-neutral-950/50 p-3 text-sm text-neutral-300">
                        <span className="text-blue-400">✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
