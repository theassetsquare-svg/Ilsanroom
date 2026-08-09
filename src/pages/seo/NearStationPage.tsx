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

export default function NearStationPage() {
  const { station } = useParams<{ station: string }>();
  const decodedStation = decodeURIComponent(station || '');
  const filtered = venues.filter(v =>
    v.status !== 'closed_or_unclear' && (
      (v.nearbyStation && v.nearbyStation.includes(decodedStation)) ||
      v.regionKo.includes(decodedStation) ||
      v.description.includes(decodedStation)
    )
  );

  // 파트2 — SSR(prerender NEAR_COPY_OVERRIDE)과 동일 카피로 정합 (CTR 0% 실측 신사만)
  const nearOverride: Record<string, [string, string]> = {
    '신사': ['신사역 도보 5분권 — 강남청담클럽 사운드 위치·후기·전화번호 바로 정리', '신사에서 걸어가는 밤 코스는 강남청담클럽 사운드가 기준점 — 위치·후기·전화번호를 거리순으로 정리했다. 오늘 갈 곳을 먼저 확인하고 움직이자.'],
  };
  const [nearTitle, nearDesc] = nearOverride[decodedStation] || [
    `${decodedStation} 근처 업소 ${filtered.length}곳 — 역에서 걸어서 갈 수 있는 곳`,
    `${decodedStation} 근처 클럽·나이트·라운지·룸 ${filtered.length}곳. 가까운 역에서 도보로 갈 수 있는 나이트라이프 장소를 찾아보세요.`,
  ];
  useDocumentMeta(
    nearTitle,
    nearDesc,
    undefined,
    `${decodedStation} 근처, ${decodedStation} 나이트라이프, ${decodedStation} 클럽, ${decodedStation} 나이트`
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{decodedStation} 근처 ({filtered.length}곳)</h1>
      <p className="mb-8 text-gray-600">{decodedStation}에서 가까운 업소를 모았습니다.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(v => (
          <Link key={v.id} to={getHref(v)} className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
            <h2 className="font-semibold">{v.nameKo}</h2>
            <p className="mt-1 text-sm text-gray-500">{v.regionKo} {catLabelMap[v.category]} · {v.shortDescription.slice(0, 50)}</p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-gray-400">해당 역 근처에 등록된 업소가 없습니다.</p>}
    </div>
  );
}
