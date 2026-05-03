import { useParams , Navigate } from 'react-router-dom';

import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImageBySlug } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues } from '@/data/venues';

const regionNames: Record<string, string> = {
  gangnam: '강남', ilsan: '일산', cheongdam: '청담', jongno: '종로',
  busan: '부산', daegu: '대구', daejeon: '대전', suwon: '수원', gwangju: '광주', jeju: '제주', yeouido: '여의도',
};

const defaultFaqs = (name: string) => [
  { question: `요정 문화가 처음인데 ${name}은 어떻게 이용하나요?`, answer: `요정은 프라이빗 룸에서 코스 요리와 함께 가무를 즐기는 고급 접대 문화 공간입니다. 입장 후 담당 도우미가 배정되어 식사 진행·술 서빙·대화를 도와주며, 처음이라도 자연스럽게 분위기에 녹아들 수 있습니다.` },
  { question: `코스 요리 메뉴는 어떻게 구성되나요?`, answer: `전채·구절판·생선회·갈비찜·전골·후식 등 10~15가지 이상의 정찬 코스가 줄줄이 나옵니다. 계절별로 식재료가 달라지며, 인원과 예산에 따라 코스 등급을 골라 잡으면 된다.` },
  { question: `가야금·대금 같은 공연은 언제 하나요?`, answer: `식사 시작 후 30분~1시간 사이에 악사가 룸을 방문하여 10~20분간 연주합니다. 가야금·해금·대금 등 악기 구성은 업소마다 다르며, 요청곡 연주가 가능한 곳도 있습니다.` },
  { question: `접대나 비즈니스 모임 예약은 어떻게 하나요?`, answer: `최소 2~3일 전에 전화로 인원·일시·목적·예산을 알려주면 맞춤 코스와 룸을 배정받을 수 있습니다. VIP 접대 시에는 1주일 전 예약이 안정적이며, 경험 많은 담당자가 진행을 도와줍니다.` },
  { question: `복장 규정과 전반적인 분위기는 어떤가요?`, answer: `남성은 정장 또는 셔츠에 슬랙스, 여성은 단정한 원피스나 한복이 어울리는 격식 있는 공간입니다. 조용하고 격식 있는 분위기가 특징이며, 큰 소리나 과한 행동은 자제하는 것이 매너입니다.` },
  { question: `최소 이용 금액이 정해져 있나요?`, answer: `코스 요리와 주류가 포함된 세트 금액이 기본이며, 인원수에 따라 총액이 결정됩니다. 정찰제를 운영하는 곳이 많아 사전에 총 비용을 명확히 안내받을 수 있습니다.` },
  { question: `외국인 손님 응대가 가능한가요?`, answer: `영어·일본어 기본 응대가 가능한 곳이 있으며, 사전에 외국인 동행 사실을 알려주면 영어 메뉴판이나 통역 지원을 준비해 주는 곳도 있습니다. 한국 고유의 접대 문화를 체험하려는 외국인 방문객이 점차 늘고 있습니다.` },
  { question: `단체 행사는 몇 명까지 수용 가능한가요?`, answer: `소규모 룸(4~8인)부터 대연회장(30~50인)까지 크고 작은 룸이 골고루 갖춰진 곳이 많습니다. 비즈니스 접대·거래처 만찬·기업 연회 모두 수용 가능하며, 대규모 행사는 1~2주 전 예약이 필수입니다.` },
];

/* ★ 일산명월관요정 전용 FAQ 11개 — 가게이름 Q에 2회만 */
const myeongwolgwanFaqs = [
  { question: '일산명월관요정의 위치와 교통편은?', answer: '경기도 고양시 일산동구 장항로 895-1에 위치해 있습니다. 마두역에서 도보 약 10분, 건물 내 전용 주차장 및 발렛 서비스도 있어요.' },
  { question: '한정식 코스는 어떻게 구성되나요?', answer: '15가지 이상의 정찰제 코스를 운영합니다. 계절별 신선한 식재료를 사용하며, 전채부터 후식까지 한식의 정수를 맛볼 수 있습니다. 인원에 따라 조절 가능합니다.' },
  { question: '국악 라이브 공연을 볼 수 있나요?', answer: '네, 가야금·해금 등 전통 악기 연주가 식사 중에 라이브로 펼쳐집니다. 젓가락 멈추고 귀 기울이게 되는, 이곳이 아니면 못 느낄 순간입니다.' },
  { question: '프라이빗 룸은 몇 개인가요?', answer: '총 30개의 룸을 갖추고 있습니다. 1인실부터 20인실까지 갖가지 크기가 있어 소규모 모임부터 대규모 연회까지 수용 가능합니다.' },
  { question: '비즈니스 접대에 적합한가요?', answer: '격조 있는 분위기, 정찬 코스, 국악 공연이 어우러져 VIP 접대에 최적입니다. 거래처 만찬, 외국인 대접 자리에 자주 이용되며, 신실장에게 사전 예약 시 맞춤 서비스를 받을 수 있습니다.' },
  { question: '예약은 어떻게 하나요?', answer: '신실장에게 전화하여 예약하세요. 인원, 일시, 코스를 미리 알려주시면 최적의 룸과 메뉴를 안내받을 수 있습니다.' },
  { question: '코스 안내는 어떻게 받나요?', answer: '정찰제로 투명하게 운영합니다. 코스별 상세 안내는 전화 문의로 받으실 수 있습니다.' },
  { question: '주차 및 발렛 서비스가 가능한가요?', answer: '건물 내 전용 주차장을 보유하고 있으며, 발렛 주차 서비스도 이용 가능합니다.' },
  { question: '외국인 손님 응대가 되나요?', answer: '영어·일본어 기본 응대가 가능하며, 사전에 외국인 동행 사실을 알려주면 영어 메뉴판과 통역 지원을 준비합니다. 한국 전통 접대 문화를 체험하려는 해외 비즈니스 고객 방문이 늘고 있습니다.' },
  { question: '드레스코드가 있나요?', answer: '세미 포멀 이상의 복장을 권장합니다. 격조에 맞는 복장으로 방문하시면 더욱 쾌적한 시간을 보내실 수 있습니다.' },
  { question: '명월관의 영업시간은?', answer: '기본정보 탭에서 확인하거나 신실장에게 문의해 주세요. 저녁 6시~10시가 가장 추천하는 방문 시간대입니다.' },
];

/* ★ 일산명월관요정 전용 SEO 콘텐츠 2000자+ — 가게이름 5회 이내 */
function MyeongwolgwanExtraContent() {
  return (
    <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-8 space-y-6">
      <h2 className="text-xl font-bold text-neon-text">고양시 장항로의 격조 — 한정식과 국악이 만나는 공간</h2>
      <div className="space-y-4 text-sm leading-relaxed text-neon-text-muted">
        <p>
          경기도 고양시 장항로 895-1에 자리한 격조 높은 정찬 문화 공간입니다.
          코스 요리와 국악 라이브 공연을 동시에 즐길 수 있는 이곳은
          비즈니스 접대, 거래처 만찬, 각종 연회에 최적화되어 있습니다. 가장 큰 특징은
          총 30개의 프라이빗 룸을 갖추어 1인부터 20인까지 웬만한 규모의 모임은 다 수용한다는 점입니다.
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
          전통 악기의 아름다운 선율이 식사와 함께 흐르며, 한국 고유의 문화가 온몸으로 스며듭니다.
          단순한 식사 공간을 넘어 복합 문화 체험 공간으로서의 가치를 지닙니다.
        </p>
        <p>
          신실장이 전반적인 운영을 총괄하고 있으며,
          사전 예약 시 인원, 목적, 예산에 맞춰 최적의 코스와 룸을 추천받을 수 있습니다.
          마두역에서 도보 약 10분 거리에 위치하며,
          건물 내 전용 주차장과 발렛 서비스까지 갖추고 있어 차 끌고 와도 걱정 없습니다.
        </p>
        <p>
          고양시에서 격식 있는 접대 장소를 찾거나, 잊지 못할 기념일을 계획하고 계신다면
          이곳이 최적의 선택입니다. 거래처 만찬, VIP 접대, 외국인 대접 등
          격식이 필요한 비즈니스 행사에 적합하며, 프라이빗 룸 환경에서 프라이버시가 보장됩니다.
          오랜 전통과 경험을 바탕으로 고객 한 분 한 분에게
          손님 한 분 한 분 빈틈없이 챙기는 게 이 집의 철학입니다.
        </p>
        <p>
          방문 시 세미 포멀 이상의 복장을 권장하며,
          격조에 맞는 복장으로 오시면 더욱 쾌적한 시간을 보내실 수 있습니다.
          추천 방문 시간은 저녁 6시부터 10시 사이이며, 주말·공휴일에는 사전 예약이 필수입니다.
          예약 및 문의는 신실장에게 연락해 주세요.
        </p>
      </div>
    </div>
  );
}

export default function YojeongDetailPage() {
  const { region, slug } = useParams<{ region: string; slug: string }>();
  const venue = getVenueBySlug(slug!);
  if (!venue || venue.category !== 'yojeong') return <Navigate to="/404" replace />;
  useDocumentMeta(getHookingTitle(venue) + '', getHookingDescription(venue), getVenueOgImageBySlug(venue.slug));

  const regionKo = region ? regionNames[region] || region : '';
  const related = getRelatedVenues(venue, 6);
  const isMyeongwolgwan = slug === 'ilsanmyeongwolgwanyojeong';

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
