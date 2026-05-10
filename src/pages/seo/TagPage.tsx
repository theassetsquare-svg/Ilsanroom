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

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag || '');
  const filtered = venues.filter(v =>
    v.status !== 'closed_or_unclear' && (
      v.tags.some(t => t.includes(decodedTag)) ||
      v.features.some(f => f.includes(decodedTag)) ||
      v.nameKo.includes(decodedTag) ||
      v.regionKo.includes(decodedTag)
    )
  );

  useDocumentMeta(
    `#${decodedTag} 관련 업소 ${filtered.length}곳 — 태그로 찾는 밤문화`,
    `'${decodedTag}' 태그가 붙은 클럽·나이트·라운지·룸 ${filtered.length}곳. 관심 키워드로 딱 맞는 곳을 찾아보세요.`,
    undefined,
    `${decodedTag}, ${decodedTag} 추천, 밤문화 ${decodedTag}`
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">#{decodedTag} ({filtered.length}곳)</h1>
      <p className="mb-8 text-gray-600">'{decodedTag}' 관련 업소를 모았습니다.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(v => (
          <Link key={v.id} to={getHref(v)} className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <h2 className="font-semibold">{v.nameKo}</h2>
            <p className="mt-1 text-sm text-gray-500">{v.regionKo} {catLabelMap[v.category]} · {v.shortDescription.slice(0, 50)}</p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-gray-400">해당 태그에 맞는 업소가 없습니다.</p>}
    </div>
  );
}
