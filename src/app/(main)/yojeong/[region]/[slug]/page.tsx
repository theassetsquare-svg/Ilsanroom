import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImage } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('yojeong').map((v) => ({ region: v.region, slug: v.slug }));
}

interface Props { params: Promise<{ region: string; slug: string }> }

const regionNames: Record<string, string> = {
  gangnam: '강남', ilsan: '일산', cheongdam: '청담', jongno: '종로',
  busan: '부산', daegu: '대구', daejeon: '대전', suwon: '수원', gwangju: '광주', jeju: '제주', yeouido: '여의도',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '요정을 찾을 수 없습니다 | 오늘밤어디' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 오늘밤어디`, description: venue.shortDescription, images: [{ url: getVenueOgImage(venue.nameKo, venue.category), width: 1200, height: 630 }] },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치와 찾아가는 길이 궁금해요`, answer: `정확한 위치는 기본정보 탭에서 확인할 수 있습니다. 지도 탭에서 카카오맵으로 경로 안내도 가능합니다.` },
  { question: `요정 영업시간은 어떻게 되나요?`, answer: `영업시간은 기본정보 탭에서 확인하세요. 방문 전 전화로 확인하시는 것을 권장합니다.` },
  { question: `주차 및 발렛 서비스가 가능한가요?`, answer: `주차 가능 여부와 발렛 서비스 운영 여부는 기본정보 탭에서 확인할 수 있습니다. 업소에 직접 문의도 가능합니다.` },
  { question: `한정식 코스는 어떻게 구성되나요?`, answer: `제공되는 한정식 코스와 메뉴는 메뉴·서비스 탭에서 확인할 수 있습니다. 상세 코스 구성은 업소에 문의해 주세요.` },
  { question: `예약은 어떻게 하나요?`, answer: `전화 연결을 통해 예약이 가능합니다. 하단의 전화 버튼을 눌러 직접 문의해 주세요.` },
  { question: `이용 요금은 어느 정도인가요?`, answer: `가격표 탭에서 확인할 수 있습니다. 정확한 가격은 방문 시 변동될 수 있으므로 업소에 직접 확인하세요.` },
  { question: `단체 연회나 기념일 행사도 가능한가요?`, answer: `단체 연회 및 기념일 행사 수용 가능 여부는 업소에 직접 문의해 주세요. 사전 예약을 권장합니다.` },
  { question: `${name}의 전반적인 분위기는 어떤가요?`, answer: `이곳의 분위기와 특징은 기본정보 탭에서 확인할 수 있습니다. 리뷰 탭에서 실제 방문 후기도 참고하세요.` },
];

/* ★ 일산명월관요정 전용 FAQ 11개 — 가게이름 Q에 2회만 */
const myeongwolgwanFaqs = [
  { question: '일산명월관요정의 위치와 교통편은?', answer: '경기도 고양시 일산동구 장항로 895-1에 위치해 있습니다. 마두역에서 도보 약 10분, 건물 내 전용 주차장 및 발렛 서비스를 이용할 수 있습니다.' },
  { question: '한정식 코스는 어떻게 구성되나요?', answer: '15가지 이상의 정찰제 코스를 운영합니다. 계절별 신선한 식재료를 사용하며, 전채부터 후식까지 한식의 정수를 맛볼 수 있습니다. 인원과 예산에 따라 조절 가능합니다.' },
  { question: '국악 라이브 공연을 볼 수 있나요?', answer: '네, 가야금·해금 등 전통 악기 연주가 식사와 함께 제공됩니다. 격조 높은 분위기를 더해주는 이곳만의 특별한 경험입니다.' },
  { question: '프라이빗 룸은 몇 개인가요?', answer: '총 30개의 룸을 갖추고 있습니다. 1인실부터 20인실까지 다양한 규모가 있어 소규모 모임부터 대규모 연회까지 수용 가능합니다.' },
  { question: '비즈니스 접대에 적합한가요?', answer: '격조 있는 분위기, 한정식 코스, 국악 공연이 어우러져 VIP 접대에 최적입니다. 신실장에게 사전 예약 시 맞춤 서비스를 받을 수 있습니다.' },
  { question: '예약은 어떻게 하나요?', answer: '신실장(010-3695-4929)에게 전화하여 예약하세요. 인원, 일시, 코스를 미리 알려주시면 최적의 룸과 메뉴를 안내받을 수 있습니다.' },
  { question: '이용 가격대는?', answer: '정찰제로 투명한 가격 정책을 유지합니다. 가격표 탭에서 대략적인 가격대를 확인하세요. 코스별 상세 가격은 전화 문의로 안내받으실 수 있습니다.' },
  { question: '주차 및 발렛 서비스가 가능한가요?', answer: '건물 내 전용 주차장을 보유하고 있으며, 발렛 주차 서비스도 이용 가능합니다.' },
  { question: '가족 모임에도 이용 가능한가요?', answer: '돌잔치, 환갑, 칠순, 상견례 등 가족 기념일에도 많이 이용됩니다. 프라이빗 룸 환경에서 격식 있는 모임을 진행할 수 있습니다.' },
  { question: '드레스코드가 있나요?', answer: '세미 포멀 이상의 복장을 권장합니다. 격조에 맞는 복장으로 방문하시면 더욱 쾌적한 시간을 보내실 수 있습니다.' },
  { question: '일산명월관요정의 영업시간은?', answer: '기본정보 탭에서 확인하거나 신실장(010-3695-4929)에게 문의해 주세요. 저녁 6시~10시가 가장 추천하는 방문 시간대입니다.' },
];

/* ★ 일산명월관요정 전용 SEO 콘텐츠 2000자+ — 가게이름 5회 이내 */
function MyeongwolgwanExtraContent() {
  return (
    <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-8 space-y-6">
      <h2 className="text-xl font-bold text-neon-text">고양시 장항로의 격조 — 한정식과 국악이 만나는 공간</h2>
      <div className="space-y-4 text-sm leading-relaxed text-neon-text-muted/80">
        <p>
          일산명월관요정은 경기도 고양시 일산동구 장항로 895-1에 자리한 격조 높은 한정식 문화 공간입니다.
          한정식 코스 요리와 국악 라이브 공연을 동시에 즐길 수 있는 이곳은
          비즈니스 접대, 가족 기념일, 각종 연회에 최적화되어 있습니다. 가장 큰 특징은
          총 30개의 프라이빗 룸을 갖추어 1인부터 20인까지 다양한 규모의 모임을 수용한다는 점입니다.
        </p>
        <p>
          이곳에서는 15가지 이상의 한정식 코스를 정찰제로 운영합니다.
          계절마다 바뀌는 신선한 식재료를 활용한 코스 구성이 자랑이며,
          전채, 구절판, 한방탕, 생선회, 갈비찜, 전골 등 한식의 정수를 맛볼 수 있습니다.
          숙련된 조리사가 정성껏 준비하는 모든 코스는 투명한 정찰제로 운영되어
          가격 걱정 없이 편안하게 식사를 즐길 수 있습니다.
        </p>
        <p>
          또 다른 매력은 국악 라이브 공연입니다. 가야금, 해금, 대금 등
          전통 악기의 아름다운 선율이 식사와 함께 흐르며, 한국 고유의 문화를 직접 체험할 수 있습니다.
          단순한 식사 공간을 넘어 복합 문화 체험 공간으로서의 가치를 지닙니다.
        </p>
        <p>
          신실장(010-3695-4929)이 전반적인 운영을 총괄하고 있으며,
          사전 예약 시 인원, 목적, 예산에 맞춰 최적의 코스와 룸을 추천받을 수 있습니다.
          마두역에서 도보 약 10분 거리에 위치하며,
          건물 내 전용 주차장과 발렛 서비스를 제공하여 차량 방문도 편리합니다.
        </p>
        <p>
          고양시에서 격식 있는 접대 장소를 찾거나, 특별한 가족 모임을 계획하고 계신다면
          이곳이 최적의 선택입니다. 돌잔치, 생일, 환갑, 칠순, 상견례 등
          모든 종류의 기념일 행사에 적합하며, 프라이빗 룸 환경에서 프라이버시가 보장됩니다.
          오랜 전통과 경험을 바탕으로 고객 한 분 한 분에게
          최고 수준의 서비스를 제공하는 것을 목표로 합니다.
        </p>
        <p>
          방문 시 세미 포멀 이상의 복장을 권장하며,
          격조에 맞는 복장으로 오시면 더욱 쾌적한 시간을 보내실 수 있습니다.
          추천 방문 시간은 저녁 6시부터 10시 사이이며, 주말·공휴일에는 사전 예약이 필수입니다.
          예약 및 문의는 신실장(010-3695-4929)에게 연락해 주세요.
        </p>
      </div>
    </div>
  );
}

export default async function YojeongDetailPage({ params }: Props) {
  const { region, slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'yojeong') notFound();

  const regionKo = regionNames[region] || region;
  const related = getRelatedVenues(venue, 6);
  const isMyeongwolgwan = slug === 'ilsan-myeongwolgwan-yojeong';

  return (
    <VenueDetailPage
      venue={venue}
      categoryLabel="요정"
      categoryPath="/yojeong"
      regionKo={regionKo}
      regionPath={`/yojeong/${region}`}
      detailPath={`/yojeong/${region}/${slug}`}
      faqs={isMyeongwolgwan ? myeongwolgwanFaqs : defaultFaqs(venue.nameKo)}
      related={related}
      relatedHrefFn={(v) => `/yojeong/${v.region}/${v.slug}`}
      extraContent={isMyeongwolgwan ? <MyeongwolgwanExtraContent /> : undefined}
    />
  );
}
