import { useParams } from 'react-router-dom';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';

const catPathMap: Record<string, string> = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const catLabelMap: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const reverseCatMap: Record<string, string> = { clubs: 'club', nights: 'night', lounges: 'lounge', rooms: 'room', yojeong: 'yojeong', hoppa: 'hoppa' };

// 지역×업종 고유 안내 — 해당 키가 있는 페이지만 본문 렌더(공유 템플릿 스터핑 방지).
// 진짜 방문자 체류를 위한 동네별 자기완결 답변. 각 지역 실제 업소·동선 기반으로만 작성.
const REGION_CAT_BODY: Record<string, { lead: string; paras: string[]; sub: string }> = {
  '대전|night': {
    lead: '대전에서 밤에 춤추며 사람 만날 곳을 찾는다면, 동네부터 갈리는 동네입니다. 크게 둔산동·중앙로·유성 세 갈래로 나뉘는데, 둔산동은 7개 테마 존을 별실 동선으로 굴리는 대형 홀과 전국 브랜드 직장인 단골이 모이고, 중앙로는 38세 이상 전용으로 옆 테이블과 자연스럽게 인사하게 되는 아담한 홀이, 유성은 온천 관광 특구를 끼고 출장 손님이 금요일부터 줄을 섭니다.',
    paras: [
      '둔산역에서 5분 걸어 들어가면 트로트와 K팝 사이를 넘나드는 현장이 바로 둔산동 라인입니다. 출장 직장인이 퇴근 후 가장 먼저 찾는 동선이고, 트로트 라이브가 도는 사이마다 플로어가 채워집니다. 차분하게 또래끼리 어울리고 싶으면 중앙로역 5분의 38세+ 전용 홀이 답인데, 50평 규모라 까치 실장이 입장부터 자리까지 직접 챙기고 평일 새벽 2시 반, 주말 3시 반까지 돌아갑니다.',
      '인원과 시간대를 먼저 정하면 고르기 쉽습니다. 출장·접대로 큰 무대를 원하면 둔산동 대형 홀, 동년배끼리 편하게 대화하며 노는 밤이면 중앙로 아담한 홀, 온천 관광 끝에 들르는 코스면 유성 쪽이 자연스럽습니다. 영업시간·입장 조건은 업소마다 다르니 방문 전 각 상세 페이지에서 한 번 더 확인하세요.',
    ],
    sub: '대전 어느 동네부터 고를까',
  },
  '청주|night': {
    lead: '청주에서 밤에 춤추며 어울릴 곳은 시내 중심가에 모여 있습니다. 성안길과 중앙공원 일대를 끼고 있어 접근이 편하고, 충북대 학생부터 인근 직장인까지 폭넓게 섞입니다. 브랜드로는 모던한 선곡의 돈텔마마 계열과, 트로트 감성이 진하게 살아 있는 호박 계열이 양대 축을 이룹니다.',
    paras: [
      '돈텔마마 쪽은 시내 중심가에 있어 찾기 쉽고 비교적 젊은 손님 비중이 높습니다. 같은 시내라도 호박 쪽은 7080 트로트 메들리가 길게 이어져 좀 더 전통적인 분위기를 원하는 단골이 모입니다. 성안길 일대는 회전이 빠른 편이라, 혼자 와도 자리에 앉아 트로트 메들리에 스며드는 흐름이 자연스럽습니다.',
      '선곡 취향으로 먼저 고르면 빠릅니다. 최신 가요·댄스팝에 가까운 밤이면 돈텔마마 계열, 트로트·올드팝으로 진하게 놀고 싶으면 호박 계열입니다. 시내 한복판이라 1차 식사 자리에서 도보로 넘어오기 좋고, 새벽 귀가 동선도 시내라 끊기지 않습니다.',
    ],
    sub: '청주 시내, 어느 쪽이 내 취향일까',
  },
  '안산|night': {
    lead: '안산에서 밤에 춤추며 사람 만날 곳은 사실상 두 갈래로 압축됩니다. 반월공단을 끼고 일과 마친 야간조가 모이는 한대앞역 쪽 히트 라인과, 중앙동 번화가 한복판에서 최신 가요로 도는 돈텔마마 라인입니다. 같은 안산이어도 들어오는 손님층과 선곡이 갈리니, 오늘 누구랑 무엇을 들으며 놀고 싶은지부터 정하면 고르기가 빨라집니다.',
    paras: [
      '4호선 한대앞역에서 5분 걸어 들어가면 반월공단 야간조 직장인이 퇴근하자마자 채우는 홀이 히트 쪽입니다. 주문하면 30초 안에 음료가 도착할 만큼 회전이 빠르고, 4인 부스 16석이 주말 피크에 먼저 차며, 트로트부터 대중가요까지 시간대별로 곡을 바꿔 편성합니다. 시흥에서 차로 7분 건너오는 단골 그룹도 이 속도를 보고 넘어옵니다. 다만 토요일은 쉬는 날이라 방문 전 요일을 먼저 확인하세요.',
      '깔끔한 공간에서 최신 가요 위주로 놀고 싶으면 중앙동 중앙대로의 돈텔마마 쪽이 맞습니다. 전국 체인 특유의 정돈된 인테리어와 조명 연출에 선곡은 가요 비중이 높고, 금요일·토요일 밤이 가장 붐빕니다. 중앙동 번화가에서 식사를 마치고 도보 5분 거리로 옮기기 좋아 동선이 끊기지 않습니다. 월요일은 휴무이니 평일 방문이면 요일을 챙겨두는 편이 안전합니다.',
    ],
    sub: '안산 나이트, 히트와 돈텔마마 중 어디부터',
  },
  '일산|night': {
    lead: '일산에서 밤에 춤추며 어울릴 곳은 호수공원을 사이에 두고 세 군데로 갈립니다. 3호선 마두역 라페스타 골목의 샴푸 라인, 화정역 도보 3분 터널형 홀, 대화역 쪽 남녀 비율을 직접 관리하는 물 좋은 홀입니다. 같은 일산이라도 역과 콘셉트가 다 다르니, 오늘 누구와 어떤 밤을 보내고 싶은지부터 정하면 고르기가 한결 쉬워집니다.',
    paras: [
      '마두역에서 5분 걸어 라페스타 골목으로 들어가면 미러볼 아래 자이브와 스윙이 돌다가 11시쯤 트로트 메들리로 넘어가는 홀이 샴푸 쪽입니다. 파주·김포에서 차로 넘어오는 단골이 이 흐름을 보고 모이고, 공영주차장 120면이 붙어 있어 차로 와도 부담이 없습니다. 인테리어 자체를 즐기고 싶으면 화정역 도보 3분의 터널형 홀이 답인데, Bose 음향과 라이브 밴드에 단체석까지 있어 회식 2차로 무리째 옮겨오기 좋습니다.',
      '혼자 와도 어색하지 않게 놀고 싶으면 대화역 쪽 물나이트가 맞습니다. 남녀 비율을 직접 관리하고 메인홀과 서브라운지를 나눠 둔 데다 신청곡도 받아, 혼자 들어와 VIP 1열에 앉아도 자연스럽게 섞입니다. 정리하면 트로트로 무르익는 밤이면 마두 라페스타, 음향과 인테리어로 분위기 잡는 회식이면 화정 터널형, 자연스러운 만남이 목적이면 대화 쪽입니다.',
    ],
    sub: '일산 호수 건너 어느 역부터 갈까',
  },
  '대구|night': {
    lead: '대구에서 밤에 춤추며 놀 곳은 동성로를 중심으로 성격이 뚜렷하게 갈립니다. 관악기까지 갖춘 전속 밴드의 한국관, 250평 대형 홀에 편한 차림으로 떼창하는 호박, 장르 경계 없이 도는 100평 바밤바, K팝 리믹스로 또래를 끄는 토토가입니다. 라이브냐 규모냐 장르냐 — 무엇을 우선할지 정하면 동선이 바로 잡힙니다.',
    paras: [
      '제대로 된 라이브를 원하면 한국관 쪽입니다. 트럼펫을 포함한 6인 전속 밴드가 고음을 뽑아 올리면 홀 전체가 울리는데, 대구·경북에서 관악기가 상주하는 편성은 흔치 않습니다. 규모와 편안함을 같이 잡고 싶으면 칠곡중앙대로역 3번 출구 4분의 호박이 맞는데, 250평 홀에 사방 통풍구라 한여름에도 쾌적하고 운동화에 청바지로 와도 눈치 볼 일이 없습니다. 수·금·토 악단이 나훈아부터 핑클까지 떼창을 끕니다.',
      '장르를 가리지 않고 흥에 맡기고 싶으면 동성로 도보 5분의 바밤바가 답입니다. 트로트·올드팝·최신가요가 틀 없이 오가는 100평 홀에 음료 리필이 빠르고 겨울엔 코트도 맡아줍니다. 또래끼리 최신 음악으로 달리고 싶으면 토토가가 맞는데, K팝 리믹스와 글로벌 팝 위주라 금요 야근을 끝낸 직장인이 넥타이를 풀며 몰리는 현장입니다.',
    ],
    sub: '대구 동성로, 라이브·규모·장르 중 무엇부터',
  },
  '광주|night': {
    lead: '광주에서 밤에 춤추며 어울릴 곳은 서구 상무·치평 라인과 광산·남구 대형 홀, 첨단지구 신흥 라인으로 나뉩니다. 호남 밴드마스터가 트로트를 차차차로 넘기는 상무, VIP석을 갖춘 대형 MGM, IT 인구가 모이는 첨단 엠파, 새벽까지 도는 시내 올나이트까지 색이 다 다릅니다. 동네와 마무리 시간대를 먼저 정하면 고르기가 빠릅니다.',
    paras: [
      '정통 트로트로 분위기를 잡고 싶으면 운천역 치평동의 상무 쪽인데, 상무법원 뒤 도보 10분 거리에서 밴드마스터가 트로트를 차차차로 전환하며 홀을 끌고 갑니다. 부담 없이 흥만 풀고 싶은 사회초년생이면 광산구 토토밤이 맞는데, 9시 30분쯤 트로트가 디스코로 튕기며 자연스럽게 달아오릅니다. 또래 직장인과 최신 음악으로 놀고 싶으면 첨단지구 엠파가 답으로, EDM과 최신 가요를 섞어 30~40대가 주축입니다.',
      '큰 무대와 넉넉한 자리를 원하면 광산구 MGM이 맞습니다. 천장 높은 대형 홀에 VIP석 10개, 거의 매일 라이브 밴드가 오르고 시내에서 차로 10분에 주차장이 완비돼 단체로 움직이기 좋습니다. 다른 곳이 문을 닫는 새벽까지 이어가고 싶으면 시내 올나이트가 답인데, 밤 12시에 도착해도 한참 남아 마무리 코스로 자연스럽게 모입니다.',
    ],
    sub: '광주 어느 동네, 어디까지 달릴까',
  },
};

function getHref(v: { category: string; region: string; slug: string }) {
  const base = catPathMap[v.category] || v.category;
  return ['club', 'room', 'yojeong'].includes(v.category) ? `/${base}/${v.region}/${v.slug}` : `/${base}/${v.slug}`;
}

export default function RegionCategoryPage() {
  const { region, category } = useParams<{ region: string; category: string }>();
  const catKey = reverseCatMap[category || ''] || category || '';
  const catKo = catLabelMap[catKey] || catKey;
  const decodedRegion = decodeURIComponent(region || '');
  const filtered = venues.filter(v =>
    v.category === catKey && v.regionKo === decodedRegion && v.status !== 'closed_or_unclear'
  );

  useDocumentMeta(
    `${decodedRegion} ${catKo} ${filtered.length}곳 — 한눈에 비교하고 고르기`,
    `${decodedRegion} 지역 ${catKo} ${filtered.length}곳 비교. 분위기·후기·위치 정보를 확인하고 오늘 밤 갈 곳을 정하세요.`,
    undefined,
    `${decodedRegion} ${catKo}, ${decodedRegion} ${catKo} 추천, ${decodedRegion} 나이트라이프`
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{decodedRegion} {catKo} ({filtered.length}곳)</h1>
      <p className="mb-8 text-gray-600">{decodedRegion} 지역 {catKo}를 비교하고 선택하세요.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(v => (
          <Link key={v.id} to={getHref(v)} className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <h2 className="font-semibold">{v.nameKo}</h2>
            <p className="mt-1 text-sm text-gray-500">{v.shortDescription.slice(0, 60)}</p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-gray-400">해당 지역에 {catKo}가 없습니다.</p>}

      {REGION_CAT_BODY[`${decodedRegion}|${catKey}`] && (() => {
        const body = REGION_CAT_BODY[`${decodedRegion}|${catKey}`];
        return (
          <section className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-3">
            <h2 className="text-base font-bold text-gray-900">{body.sub}</h2>
            <p className="text-sm leading-relaxed text-gray-700">{body.lead}</p>
            {body.paras.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-gray-700">{p}</p>
            ))}
          </section>
        );
      })()}
    </div>
  );
}
