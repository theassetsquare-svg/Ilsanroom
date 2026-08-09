import { useParams } from 'react-router-dom';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues, categories } from '@/data/venues';
import { splitByPopularity } from '@/lib/popularity';
import RankingBasisNote from '@/components/ui/RankingBasisNote';
import InlineJoinCard from '@/components/auth/InlineJoinCard';

const catPathMap: Record<string, string> = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const catLabelMap: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
// prerender-seo.mjs BEST_TITLE_SUFFIX_BY_CAT 1:1 미러 — 하이드레이션 후 title이 SSR과 달라지는 드리프트 방지.
const titleSuffixMap: Record<string, string> = {
  club: '발길 끊이지 않는 곳들',
  night: '왜 다들 여기로 몰릴까',
  lounge: '주말마다 북적이는 상위권',
  room: '회원들이 가장 많이 찾는다',
  yojeong: '두 번 세 번 다시 가는 곳',
  hoppa: '한 번 가면 또 찾는 단골집',
};

// 업종별 인기순 안내 — 해당 키가 있는 페이지만 본문 렌더(공유 템플릿 스터핑 방지).
// 랭킹이 뭘 기준으로 도는지, 그래서 어떻게 읽으면 되는지 자기완결 답변.
const BEST_BODY: Record<string, { lead: string; paras: string[]; sub: string }> = {
  club: {
    lead: '인기순으로 위에 올라온 클럽이라고 해서 무조건 내 밤에 맞는 건 아닙니다. 이 순위는 지금 가장 많이 찾고 후기가 도는 곳을 위로 모은 것뿐이라, 결국 내가 들을 음악과 갈 동네를 먼저 정해야 고르기가 빨라집니다. EDM·하우스로 크게 노는 대형 플로어, 힙합·R&B 중심의 중소형, 외국인이 섞이는 다국적 파티는 같은 상위권 안에서도 결이 완전히 다릅니다.',
    paras: [
      '위 목록은 강남·압구정·청담의 큰 사운드 시스템을 갖춘 베뉴부터, 홍대의 인디·얼터너티브가 섞인 중소형, 이태원의 다문화 플로어까지 한자리에 섞여 있습니다. 그래서 순위 숫자보다 각 줄에 붙은 동네와 한 줄 설명을 먼저 보고, 오늘 듣고 싶은 음악과 맞는 곳을 짚는 게 실속 있습니다.',
      '인원도 변수입니다. 둘셋이면 바 카운터에서 시작해 플로어에 합류하기 좋은 곳이 편하고, 단체면 테이블 예약이 사실상 필수인 대형 베뉴가 낫습니다. 드레스코드·입장 조건은 업소마다 다르니, 끌리는 곳을 누르면 나오는 상세 페이지에서 영업 여부와 조건을 한 번 더 확인하고 움직이세요.',
    ],
    sub: '인기 클럽, 순위만 보고 고르면 안 되는 이유',
  },
};

function getHref(v: { category: string; region: string; slug: string }) {
  const base = catPathMap[v.category] || v.category;
  return ['club', 'room', 'yojeong'].includes(v.category) ? `/${base}/${v.region}/${v.slug}` : `/${base}/${v.slug}`;
}

export default function BestCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const catKey = Object.entries(catPathMap).find(([, v]) => v === category)?.[0] || category || '';
  const catKo = catLabelMap[catKey] || catKey;
  const filtered = venues.filter(v => v.category === catKey && v.status !== 'closed_or_unclear');

  // 2026-07-08 정직화 — 조회수·후기 데이터 없이 "실시간 랭킹" 주장 금지(신뢰규칙). 사실(영업 확인·지역 비교)만.
  useDocumentMeta(
    `${catKo} 인기 TOP ${filtered.length} — ${titleSuffixMap[catKey] || '오늘 갈 곳 여기서 결정'}`,
    `전국 ${catKo} ${filtered.length}곳을 지역·분위기로 비교. 지금 영업 확인된 곳만 모았으니 오늘 갈 ${catKo} 고르기가 5분이면 끝납니다.`,
    undefined,
    `${catKo} 인기, ${catKo} 추천, ${catKo} 랭킹, ${catKo} TOP, 인기 ${catKo}`
  );

  // 파트4 S1 — 순위 = 실측만. 표본 부족(업소 1~3곳) 카테고리는 순위 자체를 열지 않는다(침묵 원칙).
  const { ranked, recent } = splitByPopularity(filtered);
  const smallSample = filtered.length <= 3;
  const showRanks = !smallSample && ranked.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">{catKo} 인기 TOP {filtered.length}</h1>
      <div className="mb-4"><RankingBasisNote /></div>
      <p className="mb-8 text-gray-600">지금 영업이 확인된 전국 {catKo} {filtered.length}곳입니다. 각 줄의 동네와 한 줄 소개를 보고 끌리는 곳부터 눌러보세요.</p>
      {!showRanks && (
        <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-center">
          <p className="text-sm font-bold text-gray-900">순위 준비 중 · 데이터 쌓이는 중</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {smallSample
              ? `${catKo}는 등록 업소가 적어 순위 대신 최신 등록순으로 보여드려요.`
              : '28일 조회 표본이 모이면 실측 순위가 열립니다. 지금은 최신 등록순입니다.'}
          </p>
        </div>
      )}
      <div className="space-y-4">
        {(showRanks ? ranked : [...filtered].reverse()).map((v, i) => (
          <Link key={v.id} to={getHref(v)} className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            {showRanks && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">{i + 1}</span>
            )}
            <div>
              <h2 className="font-semibold">{v.nameKo}</h2>
              <p className="mt-1 text-sm text-gray-500">{v.regionKo} {catKo} · {v.shortDescription.slice(0, 60)}</p>
            </div>
          </Link>
        ))}
      </div>
      {showRanks && recent.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-bold text-gray-400">최신 등록순 — 조회 데이터가 쌓이는 중이라 순위 없이 보여드려요</p>
          <div className="space-y-4">
            {recent.map((v) => (
              <Link key={v.id} to={getHref(v)} className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
                <div>
                  <h2 className="font-semibold">{v.nameKo}</h2>
                  <p className="mt-1 text-sm text-gray-500">{v.regionKo} {catKo} · {v.shortDescription.slice(0, 60)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {BEST_BODY[catKey] && (
        <section className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-3">
          <h2 className="text-base font-bold text-gray-900">{BEST_BODY[catKey].sub}</h2>
          <p className="text-sm leading-relaxed text-gray-700">{BEST_BODY[catKey].lead}</p>
          {BEST_BODY[catKey].paras.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-700">{p}</p>
          ))}
        </section>
      )}

      <div className="mt-10">
        <InlineJoinCard context="best" />
      </div>
    </div>
  );
}
