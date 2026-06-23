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
      '둔산역에서 5분 걸어 들어가면 트로트와 K팝 사이를 넘나드는 현장이 바로 둔산동 라인입니다. 출장 직장인이 퇴근 후 가장 먼저 찾는 동선이고, 트로트 라이브가 도는 사이마다 플로어가 채워집니다. 차분하게 또래끼리 어울리고 싶으면 중앙로역 5분의 38세+ 전용 홀이 답인데, 50평 규모라 막내 실장이 입장부터 자리까지 직접 챙기고 평일 새벽 2시 반, 주말 3시 반까지 돌아갑니다.',
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
