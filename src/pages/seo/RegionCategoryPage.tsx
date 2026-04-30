import { useParams, Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';

const catPathMap: Record<string, string> = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const catLabelMap: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const reverseCatMap: Record<string, string> = { clubs: 'club', nights: 'night', lounges: 'lounge', rooms: 'room', yojeong: 'yojeong', hoppa: 'hoppa' };

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
    `${decodedRegion} ${catKo}, ${decodedRegion} ${catKo} 추천, ${decodedRegion} 밤문화`
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
    </div>
  );
}
