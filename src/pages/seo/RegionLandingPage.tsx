import { useParams } from 'react-router-dom';
import { isAdVenue, isListed, sortVenues } from '@/lib/venue-order';
import { popularity } from '@/lib/popularity';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';

const catPathMap: Record<string, string> = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const catLabelMap: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

function getHref(v: { category: string; region: string; slug: string }) {
  const base = catPathMap[v.category] || v.category;
  return ['club', 'room', 'yojeong'].includes(v.category) ? `/${base}/${v.region}/${v.slug}` : `/${base}/${v.slug}`;
}

export default function RegionLandingPage() {
  const { region } = useParams<{ region: string }>();
  const all = venues.filter(v => v.regionKo === region && v.status !== 'closed_or_unclear');
  const onlyListed = all.filter((v) => isListed(v));
  const filtered = sortVenues(onlyListed.length ? onlyListed : all, 'rec', popularity.venues); // [놀쿨12-2] 추천 순서 · 같은 가게 한 번
  const byCat = filtered.reduce<Record<string, typeof filtered>>((acc, v) => {
    const k = v.category;
    (acc[k] = acc[k] || []).push(v);
    return acc;
  }, {});

  useDocumentMeta(
    `${region} 나이트라이프 ${filtered.length}곳 — 클럽·라운지·룸·요정 한눈에`,
    `${region} 지역 클럽, 나이트, 라운지, 룸, 요정, 호빠 ${filtered.length}곳 비교. ${region} 나이트라이프 정보를 한 곳에서 확인하세요.`,
    undefined,
    `${region} 나이트라이프, ${region} 클럽, ${region} 나이트, ${region} 룸, ${region} 라운지`
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{region} 나이트라이프 {filtered.length}곳</h1>
      <p className="mb-8 text-gray-600">{region} 지역 나이트라이프 업소를 업종별로 정리했습니다.</p>
      {Object.entries(byCat).map(([cat, vList]) => (
        <section key={cat} className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">{region} {catLabelMap[cat]} ({vList.length}곳)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {vList.map(v => (
              <Link key={v.id} to={getHref(v)} className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
                <h3 className="font-semibold">{v.nameKo} {isAdVenue(v) && <span className="ml-1 rounded border border-[#111] bg-white px-1.5 py-0.5 text-xs font-bold text-[#111] align-middle" data-ad-label>광고</span>}</h3>
                <p className="mt-1 text-sm text-[#444] line-clamp-2">{v.shortDescription}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {filtered.length === 0 && <p className="text-gray-400">해당 지역에 등록된 업소가 없습니다.</p>}
    </div>
  );
}
