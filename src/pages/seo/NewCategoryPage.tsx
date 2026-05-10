import { useParams } from 'react-router-dom';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';

const catPathMap: Record<string, string> = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const catLabelMap: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

function getHref(v: { category: string; region: string; slug: string }) {
  const base = catPathMap[v.category] || v.category;
  return ['club', 'room', 'yojeong'].includes(v.category) ? `/${base}/${v.region}/${v.slug}` : `/${base}/${v.slug}`;
}

export default function NewCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const catKey = Object.entries(catPathMap).find(([, v]) => v === category)?.[0] || category || '';
  const catKo = catLabelMap[catKey] || catKey;
  const filtered = venues.filter(v => v.category === catKey && v.status !== 'closed_or_unclear');

  useDocumentMeta(
    `새로 입점한 ${catKo} ${filtered.length}곳 — 아직 안 가본 곳 먼저 발견`,
    `최근 등록된 ${catKo} ${filtered.length}곳. 새로 오픈하거나 입점한 ${catKo}를 놀쿨에서 먼저 확인하세요.`,
    undefined,
    `신규 ${catKo}, 새로운 ${catKo}, ${catKo} 오픈, 최근 ${catKo}`
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">새로 입점한 {catKo} {filtered.length}곳</h1>
      <p className="mb-8 text-gray-600">최근 놀쿨에 등록된 {catKo}를 확인하세요. 남들보다 먼저 발견하는 재미.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(v => (
          <Link key={v.id} to={getHref(v)} className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <h2 className="font-semibold">{v.nameKo}</h2>
            <p className="mt-1 text-sm text-gray-500">{v.regionKo} · {v.shortDescription.slice(0, 60)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
