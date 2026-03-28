import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getVenuesByCategoryAndRegion } from '@/data/venues';
import type { Venue } from '@/types';


const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', itaewon: '이태원', ilsan: '일산',
  cheongdam: '청담', geondae: '건대',
};

const SIZE_TAGS = [
  { label: '2-4인', min: 2, max: 4 },
  { label: '5-10인', min: 5, max: 10 },
  { label: '10인+', min: 11, max: 999 },
] as const;

const PURPOSE_FILTERS = ['비즈니스 접대용', '친구 모임용'] as const;

function RoomCard({ venue, region }: { venue: Venue; region: string }) {
  const hasBooking = venue.features?.some((f) =>
    f.includes('예약') || f.includes('booking')
  );
  return (
    <Card href={`/rooms/${region}/${venue.slug}`}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {hasBooking && (
          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            예약 가능
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-neon-text mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neon-text-muted">
        {!venue.nameKo.includes(venue.regionKo) && <span>{venue.regionKo}</span>}
        {venue.bestTime && <span>{venue.bestTime}</span>}
      </div>
      <p className="text-sm text-neon-text-muted line-clamp-2">{venue.shortDescription}</p>
      {venue.features?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {venue.features.slice(0, 3).map((f) => (
            <span key={f} className="text-xs text-teal-600">#{f}</span>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function RegionalRoomsPage() {
  const { region } = useParams<{ region: string }>();
  const regionKo = regionNames[region] || region;
  useDocumentMeta(`${regionKo} 프라이빗 공간 | 플밤`, `${regionKo} 프라이빗 룸 리스트. 소규모 미팅부터 단체 회식까지.`);
  const rooms = getVenuesByCategoryAndRegion('room', region);
  const [activePurpose, setActivePurpose] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activePurpose) return rooms;
    if (activePurpose === '비즈니스 접대용') {
      return rooms.filter((v) =>
        v.atmosphere?.some((a) => a.includes('비즈니스') || a.includes('접대') || a.includes('격식')) ||
        v.tags?.some((t) => t.includes('접대') || t.includes('비즈니스'))
      );
    }
    return rooms.filter((v) =>
      v.atmosphere?.some((a) => a.includes('친구') || a.includes('캐주얼') || a.includes('편한')) ||
      v.tags?.some((t) => t.includes('모임') || t.includes('친구'))
    );
  }, [rooms, activePurpose]);

  return (
    <div className="bg-neon-bg">
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '룸', href: '/rooms' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-neon-text">{regionKo} 룸</h1>
        <p className="mt-3 text-neon-text-muted">
          {regionKo}에서 프라이빗한 자리를 위한 공간입니다. 인원과 목적에 맞는 곳을 찾아보세요.
        </p>
      </section>

      {/* 인원별 안내 */}
      <section className="mx-auto max-w-[1200px] px-4 pb-4 sm:px-6">
        <h2 className="mb-3 text-base font-bold text-neon-text">인원별 안내</h2>
        <div className="grid grid-cols-3 gap-3">
          {SIZE_TAGS.map(({ label, min, max }) => {
            const count = rooms.filter((v) => {
              const cap = parseInt(v.features?.find((f) => /\d+인/.test(f)) || '0', 10);
              return cap >= min && cap <= max;
            }).length;
            return (
              <div key={label} className="rounded-lg border border-neon-border bg-white p-3 text-center">
                <p className="text-lg font-bold text-teal-600">{label}</p>
                <p className="mt-1 text-xs text-neon-text-muted">{count > 0 ? `${count}곳 확인됨` : '정보 준비 중'}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 목적별 필터 */}
      <section className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
        <h2 className="mb-3 text-base font-bold text-neon-text">용도별 탐색</h2>
        <div className="flex gap-2">
          {PURPOSE_FILTERS.map((purpose) => (
            <button
              key={purpose}
              onClick={() => setActivePurpose(activePurpose === purpose ? null : purpose)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                activePurpose === purpose
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-neon-border bg-white text-neon-text-muted hover:border-teal-300'
              }`}
            >
              {purpose}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
        {activePurpose && (
          <p className="mb-4 text-sm text-neon-text-muted">
            &quot;{activePurpose}&quot; 필터 적용 - {filtered.length}곳
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((venue) => <RoomCard key={venue.id} venue={venue} region={region} />)}
        </div>
        {filtered.length === 0 && (
          <p className="py-20 text-center text-neon-text-muted">
            {activePurpose
              ? `${regionKo}에서 "${activePurpose}" 조건에 해당하는 프라이빗 공간이 없습니다.`
              : `${regionKo} 동네에 등록된 프라이빗 공간이 없습니다.`}
          </p>
        )}
      </section>
    </div>
  );
}
