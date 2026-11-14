import { useParams , Navigate } from 'react-router-dom';

import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImageBySlug } from '@/lib/og-image';
import { pageCardOf, pageCardJpg } from '@/lib/venue-file-ver'; // [일산76-1] 쪽 카드 표 — 광고 카드가 걸린 가게 쪽은 og:image 도 그 카드(프리렌더 withPageCard · VenueHero 첫 그림과 같은 파일)
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

/* ★ 일산명월관요정 전용 FAQ 8개 — 가게이름 Q에 2회만
 *   [일산76-1 · 2026-11-13] 답의 사실은 src/data/ilsanmyeongwolgwan-confirmed.json(2026-07-30 업소 확인)만
 *   옛 답의 장항로·30개 방·1인실·전용 주차장·가야금·도보 10분은 확인 자료와 어긋나 고쳤고, 근거가 없는 외국어 응대·복장 권장·추천 시간대·정찰제 묻고 답하기는 뺐다 */
const myeongwolgwanFaqs = [
  { question: '일산명월관요정의 위치와 교통편은?', answer: '경기도 고양시 일산동구 장항동 895-1 B1층입니다. 가까운 역은 지하철 3호선 마두역이고, 차로 오면 발렛 주차를 맡길 수 있습니다.' },
  { question: '한정식 코스는 어떻게 구성되나요?', answer: '계절마다 바뀌는 15첩 궁중 상차림입니다. 봄엔 냉이된장국, 여름엔 전복삼계탕, 가을엔 송이버섯전골, 겨울엔 굴떡국이 오르고, 코스는 다도로 마무리합니다.' },
  { question: '국악 라이브 공연을 볼 수 있나요?', answer: '네. 식사에 거문고·해금 합주가 함께합니다.' },
  { question: '프라이빗 룸은 몇 개인가요?', answer: '모두 15개입니다. 6인 소형 다다미방 8개, 10인 중형 한실 5개, 20인 이상 들어가는 대연회장 2개로 나뉩니다.' },
  { question: '비즈니스 접대에 적합한가요?', answer: '방이 따로 나뉘어 있어 일행끼리 식사할 수 있고, 정찬에 거문고·해금 합주가 함께합니다. 큰 자리는 20인 이상 들어가는 대연회장 2개를 쓸 수 있습니다.' },
  { question: '예약은 어떻게 하나요?', answer: '예약할 때 인원, 일시, 코스를 미리 알려주시면 알맞은 룸과 메뉴를 안내받을 수 있습니다. 연락처는 이 쪽의 광고 카드에 있습니다.' },
  { question: '주차 및 발렛 서비스가 가능한가요?', answer: '네. 발렛 주차를 맡길 수 있습니다.' },
  { question: '명월관의 영업시간은?', answer: '월요일부터 토요일까지 17:00에 열어 다음 날 02:00에 닫고, 일요일은 쉽니다.' },
];

/* ★ 일산명월관요정 전용 본문 — 가게이름 5회 이내
 *   [일산76-1 · 2026-11-13] 사실은 src/data/ilsanmyeongwolgwan-confirmed.json(2026-07-30 업소 확인)만
 *   옛 글의 장항로·30개 방·1인실·전용 주차장·가야금·대금·도보 10분은 확인 자료와 어긋나 고쳤고, 근거가 없는 차림 목록·조리사·외국인 대접·복장·추천 시간대·정찰제 줄과
 *   깨진 문장(「고객 한 분 한 분에게 손님 한 분 한 분」)은 뺐다. 글자 수를 채우려고 늘리지 않는다(docs 후킹제목_끝까지읽기 1_규칙 2절) */
function MyeongwolgwanExtraContent() {
  return (
    <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-8 space-y-6">
      <h2 className="text-xl font-bold text-neon-text">고양시 장항동의 격조 — 한정식과 국악이 만나는 공간</h2>
      {/* useDocumentMeta: 백링크는 첫 문단(VenueDetailTabs)으로 통합 — 중복 anchor 제거 */}
      <p className="text-sm leading-relaxed text-neon-text-muted">
        일산명월관요정은 계절마다 식재료를 교체하는 15첩 궁중 상차림과 거문고·해금 합주가 어우러진 전통 정찬 코스를 운영합니다.
      </p>
      <div className="space-y-4 text-sm leading-relaxed text-neon-text-muted">
        <p>
          경기도 고양시 일산동구 장항동 895-1 B1층에 있습니다.
          방은 6인 소형 다다미방 8개, 10인 중형 한실 5개, 20인 이상이 들어가는 대연회장 2개로 모두 15개입니다.
          거래처 만찬이나 회사 연회처럼 오는 사람 수가 정해진 자리라면 그 수에 맞춰 방을 고르면 됩니다.
        </p>
        <p>
          상차림은 계절마다 바뀝니다.
          봄에는 냉이된장국, 여름에는 전복삼계탕, 가을에는 송이버섯전골, 겨울에는 굴떡국이 오릅니다.
          식사에는 거문고·해금 합주가 함께하고, 코스는 다도로 마무리합니다.
        </p>
        <p>
          가까운 역은 지하철 3호선 마두역이고, 차로 오면 발렛 주차를 맡길 수 있습니다.
          문은 월요일부터 토요일까지 17:00에 열어 다음 날 02:00에 닫고, 일요일은 쉽니다.
        </p>
      </div>
    </div>
  );
}

export default function YojeongDetailPage() {
  const { region, slug } = useParams<{ region: string; slug: string }>();
  const venue = getVenueBySlug(slug!);
  // [놀쿨12-2 · P39·P40] 훅은 일찍 돌아가기(Navigate) 전에 — 같은 쪽 틀에서 잘못된 주소 → 맞는 주소로 옮길 때 React 오류 #310(훅 수가 달라짐)이 나던 것
  const valid = !!venue && venue.category === 'yojeong';
  // [일산76-1 · 대표님 2026-11-13 13:30] 쪽 카드(PAGE_CARD · kind 'ad')가 걸린 가게 쪽은 og:image 도 그 카드 파일 — 프리렌더가 박은 값을 수화 뒤 가게 카드(홈·목록용 3줄 판)로 덮어쓰지 않게 한다(호빠 틀의 놀쿨61-1 과 같은 길)
  const pageCard = valid ? pageCardOf(`/yojeong/${region}/${slug}/`) : null;
  const ogImage = valid ? (pageCard && pageCard.kind === 'ad' ? `https://nolcool.com${pageCardJpg(pageCard.file)}` : getVenueOgImageBySlug(venue!.slug)) : undefined;
  useDocumentMeta(valid ? getHookingTitle(venue!) + '' : '', valid ? getHookingDescription(venue!) : '', ogImage);
  if (!valid || !venue) return <Navigate to="/404" replace />;

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
