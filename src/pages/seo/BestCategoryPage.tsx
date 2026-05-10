import { useParams } from 'react-router-dom';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues, categories } from '@/data/venues';

const catPathMap: Record<string, string> = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const catLabelMap: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

function getHref(v: { category: string; region: string; slug: string }) {
  const base = catPathMap[v.category] || v.category;
  return ['club', 'room', 'yojeong'].includes(v.category) ? `/${base}/${v.region}/${v.slug}` : `/${base}/${v.slug}`;
}

export default function BestCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const catKey = Object.entries(catPathMap).find(([, v]) => v === category)?.[0] || category || '';
  const catKo = catLabelMap[catKey] || catKey;
  const filtered = venues.filter(v => v.category === catKey && v.status !== 'closed_or_unclear');

  useDocumentMeta(
    `${catKo} 인기 TOP ${filtered.length} — 후기·조회수 기준 실시간 랭킹`,
    `전국 ${catKo} 인기순 ${filtered.length}곳 비교. 조회수·후기 기준 실시간 랭킹. 지금 가장 핫한 ${catKo}를 확인하세요.`,
    undefined,
    `${catKo} 인기, ${catKo} 추천, ${catKo} 랭킹, ${catKo} TOP, 인기 ${catKo}`
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{catKo} 인기 TOP {filtered.length}</h1>
      <p className="mb-8 text-gray-600">조회수·후기 기준으로 지금 가장 많이 찾는 {catKo} {filtered.length}곳을 모았습니다.</p>
      <div className="space-y-4">
        {filtered.map((v, i) => (
          <Link key={v.id} to={getHref(v)} className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">{i + 1}</span>
            <div>
              <h2 className="font-semibold">{v.nameKo}</h2>
              <p className="mt-1 text-sm text-gray-500">{v.regionKo} {catKo} · {v.shortDescription.slice(0, 60)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
