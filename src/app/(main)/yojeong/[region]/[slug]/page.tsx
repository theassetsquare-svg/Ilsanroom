import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import JsonLd from '@/components/seo/JsonLd';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export function generateStaticParams() {
  return getVenuesByCategory('yojeong').map((v) => ({
    region: v.region,
    slug: v.slug,
  }));
}

interface Props {
  params: Promise<{ region: string; slug: string }>;
}

const regionNames: Record<string, string> = {
  gangnam: '강남', ilsan: '일산', cheongdam: '청담',
};

function RelatedCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/yojeong/${venue.region}/${venue.slug}`}>
      <h3 className="text-base font-bold text-white mb-1">{venue.nameKo}</h3>
      <p className="text-sm text-neutral-500">{venue.regionKo}</p>
    </Card>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '요정을 찾을 수 없습니다 | NEON' };
  return {
    title: `${venue.nameKo} - ${venue.regionKo} 요정 | NEON`,
    description: venue.description,
  };
}

export default async function YojeongDetailPage({ params }: Props) {
  const { region, slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'yojeong') notFound();

  const regionKo = regionNames[region] || region;
  const related = getRelatedVenues(venue, 4);
  const isMyeongwolgwan = slug === 'ilsan-myeongwolgwan-yojeong';

  const jsonLdData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: venue.nameKo,
    description: venue.description,
    address: { '@type': 'PostalAddress', streetAddress: venue.address, addressCountry: 'KR' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: venue.rating, reviewCount: venue.reviewCount },
    openingHours: venue.openHours,
    servesCuisine: '한정식',
    priceRange: '$$$$',
  };

  if (isMyeongwolgwan) {
    jsonLdData['hasMenu'] = {
      '@type': 'Menu',
      name: '15가지 한정식 코스',
      description: '계절 식재료를 활용한 전통 한정식 코스 요리',
    };
  }

  return (
    <div className="bg-neutral-950">
      <JsonLd data={jsonLdData} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[
          { label: '요정', href: '/yojeong' },
          { label: regionKo, href: `/yojeong/${region}` },
          { label: venue.nameKo },
        ]} />
      </section>

      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 to-neutral-950" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
            {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{venue.nameKo}</h1>
          <div className="mt-3 flex items-center gap-3 text-neutral-400">
            <span className="flex items-center gap-1"><span className="text-yellow-500">★</span> {venue.rating}</span>
            <span>·</span><span>리뷰 {venue.reviewCount}개</span>
            <span>·</span><span>{venue.regionKo}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">소개</h2>
              <p className="leading-relaxed text-neutral-400">{venue.description}</p>
            </div>

            {isMyeongwolgwan && (
              <>
                <div>
                  <h2 className="mb-3 text-xl font-bold text-white">한국 전통 요정 문화</h2>
                  <p className="leading-relaxed text-neutral-400">
                    한국 전통 요정은 조선시대부터 이어져 온 격조 높은 접대 문화의 공간입니다.
                    일산명월관요정은 이러한 전통을 현대적으로 재해석하여,
                    한옥의 멋과 현대적 편의를 동시에 갖추고 있습니다.
                    전통 건축 양식의 아름다움 속에서 정성 가득한 한정식과
                    우아한 국악 선율을 즐길 수 있는 독특한 경험을 선사합니다.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 text-xl font-bold text-white">15가지 한정식 코스 요리</h2>
                  <p className="mb-4 leading-relaxed text-neutral-400">
                    일산명월관요정의 한정식 코스는 계절 식재료를 엄선하여 구성한 15가지 코스로 이루어져 있습니다.
                    전채부터 후식까지 전통 조리법을 기반으로 하되 현대적인 플레이팅을 적용하여
                    시각적 즐거움까지 더합니다. 숙련된 조리사가 매일 신선한 재료로 정성껏 준비합니다.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {['전채 모듬', '계절 나물', '해물 전골', '갈비찜', '생선구이',
                      '궁중 떡볶이', '한방 삼계탕', '잡채', '전 모듬', '비빔밥',
                      '계절 과일', '전통 후식', '식혜', '한방차', '떡 모듬'].map((item) => (
                      <div key={item} className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-center text-sm text-neutral-400">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-xl font-bold text-white">국악 연주 서비스</h2>
                  <p className="leading-relaxed text-neutral-400">
                    전문 국악 연주자가 가야금, 거문고, 대금, 해금 등 전통 악기로
                    품격 있는 연주를 선보입니다. 식사와 함께 또는 별도 시간에
                    국악 공연을 감상할 수 있으며, 특별 행사 시 맞춤형 공연도 가능합니다.
                  </p>
                </div>

                <div>
                  <h2 className="mb-3 text-xl font-bold text-white">프라이빗 룸 안내</h2>
                  <p className="mb-4 leading-relaxed text-neutral-400">
                    일산명월관요정은 1인실부터 20인실까지 총 30개의 프라이빗 룸을 보유하고 있습니다.
                    각 룸은 전통 한옥 양식의 내부 디자인과 현대적인 냉난방 시스템을 갖추고 있으며,
                    비즈니스 접대, VIP 모임, 가족 행사 등 다양한 용도로 활용할 수 있습니다.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
                      <p className="text-2xl font-bold text-violet-400">1~4인</p>
                      <p className="mt-1 text-xs text-neutral-500">소규모 밀담</p>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
                      <p className="text-2xl font-bold text-violet-400">5~10인</p>
                      <p className="mt-1 text-xs text-neutral-500">비즈니스 접대</p>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
                      <p className="text-2xl font-bold text-violet-400">11~20인</p>
                      <p className="mt-1 text-xs text-neutral-500">단체 모임</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-xl font-bold text-white">비즈니스 접대와 VIP 모임</h2>
                  <p className="leading-relaxed text-neutral-400">
                    일산명월관요정은 기업 접대와 VIP 모임에 최적화된 서비스를 제공합니다.
                    전담 매니저가 배정되어 모임의 성격에 맞는 룸 배치, 메뉴 구성,
                    공연 일정을 맞춤 설계합니다. 정찰제 운영으로 투명한 가격 정책을
                    유지하고 있어 안심하고 이용하실 수 있습니다.
                  </p>
                </div>
              </>
            )}

            <div>
              <h2 className="mb-3 text-xl font-bold text-white">특징</h2>
              <ul className="grid grid-cols-2 gap-2">
                {venue.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                    <span className="text-emerald-400">●</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">분위기</h2>
              <div className="flex flex-wrap gap-2">
                {venue.atmosphere.map((a) => <Badge key={a} variant="yojeong">{a}</Badge>)}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">태그</h2>
              <div className="flex flex-wrap gap-2">
                {venue.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
              </div>
            </div>

            {isMyeongwolgwan && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-white">자주 묻는 질문</h2>
                <div className="space-y-4">
                  {[
                    { q: '일산명월관요정은 예약이 필수인가요?', a: '네, 예약제로 운영됩니다. 원활한 서비스 제공을 위해 방문 전 사전 예약을 권장합니다.' },
                    { q: '주차 공간은 충분한가요?', a: '전용 주차장을 완비하고 있으며, 대형 차량(버스 등)도 주차 가능합니다.' },
                    { q: '국악 연주는 항상 제공되나요?', a: '기본적으로 저녁 시간대에 국악 연주가 진행됩니다. 특별 공연이 필요한 경우 사전 문의를 부탁드립니다.' },
                    { q: '단체 모임도 가능한가요?', a: '최대 20인까지 수용 가능한 대형 룸이 있으며, 여러 룸을 연결하여 더 큰 규모의 행사도 진행할 수 있습니다.' },
                    { q: '드레스코드가 있나요?', a: '포멀한 복장을 권장하며, 한복 착용도 환영합니다. 캐주얼한 복장은 자제해 주시기 바랍니다.' },
                  ].map((faq) => (
                    <div key={faq.q} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
                      <h3 className="mb-2 font-semibold text-white">{faq.q}</h3>
                      <p className="text-sm leading-relaxed text-neutral-400">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="mb-4 font-bold text-white">기본 정보</h3>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-neutral-600">위치</dt><dd className="text-neutral-300">{venue.address}</dd></div>
                <div><dt className="text-neutral-600">영업시간</dt><dd className="text-neutral-300">{venue.openHours}</dd></div>
                <div><dt className="text-neutral-600">연령대</dt><dd className="text-neutral-300">{venue.ageGroup}</dd></div>
                <div><dt className="text-neutral-600">드레스코드</dt><dd className="text-neutral-300">{venue.dressCode}</dd></div>
                <div><dt className="text-neutral-600">주차</dt><dd className="text-neutral-300">{venue.parking}</dd></div>
                <div><dt className="text-neutral-600">가까운 역</dt><dd className="text-neutral-300">{venue.nearbyStation}</dd></div>
                <div><dt className="text-neutral-600">추천 방문 시간</dt><dd className="text-neutral-300">{venue.bestTime}</dd></div>
              </dl>
            </div>

            {isMyeongwolgwan && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-6">
                <h3 className="mb-3 font-bold text-violet-400">운영 방식</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li>● 완전 예약제 운영</li>
                  <li>● 정찰제 가격 정책</li>
                  <li>● 전담 매니저 배정</li>
                  <li>● 맞춤형 메뉴 구성 가능</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <h2 className="mb-6 text-xl font-bold text-white">관련 업소</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((v) => <RelatedCard key={v.id} venue={v} />)}
          </div>
        </section>
      )}
    </div>
  );
}
