import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getVenuesByCategoryAndRegion } from '@/data/venues';
import type { Venue } from '@/types';


const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', itaewon: '이태원', haeundae: '해운대',
  ilsan: '일산', cheongdam: '청담', paju: '파주', suwon: '수원',
  sinlim: '신림', busan: '부산', daejeon: '대전', geondae: '건대',
};

const GENRE_TAGS = ['EDM', '힙합', '하우스', 'R&B', '라틴', '테크노', '올드스쿨'] as const;

function ClubCard({ venue, href }: { venue: Venue; href: string }) {
  return (
    <Card href={href}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{tag}</span>
        ))}
      </div>
      <h3 className="text-lg font-bold text-neon-text mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neon-text-muted">
        {!venue.nameKo.includes(venue.regionKo) && <span>{venue.regionKo}</span>}
        {venue.ageGroup && <span>{venue.ageGroup}</span>}
      </div>
      <p className="text-sm text-neon-text-muted line-clamp-2">{venue.shortDescription}</p>
      {venue.atmosphere?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {venue.atmosphere.slice(0, 3).map((a) => (
            <span key={a} className="text-xs text-purple-500">#{a}</span>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function RegionalClubsPage() {
  const { region } = useParams<{ region: string }>();
  const regionKo = regionNames[region] || region;
  useDocumentMeta(`${regionKo} 파티 공간 | 플밤`, `${regionKo}에서 터지는 파티 공간, 한눈에 비교.`);
  const clubs = getVenuesByCategoryAndRegion('club', region);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const avgRating = useMemo(() => {
    if (clubs.length === 0) return 0;
    return (clubs.reduce((sum, v) => sum + v.rating, 0) / clubs.length).toFixed(1);
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    if (!selectedGenre) return clubs;
    return clubs.filter((v) =>
      v.tags?.some((t) => t.toLowerCase().includes(selectedGenre.toLowerCase())) ||
      v.features?.some((f) => f.toLowerCase().includes(selectedGenre.toLowerCase()))
    );
  }, [clubs, selectedGenre]);

  return (
    <div className="bg-neon-bg">
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '클럽', href: '/clubs' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-neon-text">{regionKo} 클럽</h1>
        <p className="mt-3 text-neon-text-muted">
          {regionKo} 지역의 댄스홀과 파티 공간 총정리. 음악 장르, 분위기, 연령대별로 비교해봐.
        </p>
      </section>

      {/* 통계 바 */}
      <section className="mx-auto max-w-[1200px] px-4 pb-4 sm:px-6">
        <div className="flex items-center gap-4 rounded-lg border border-neon-border bg-white px-5 py-3">
          <span className="text-sm font-semibold text-neon-text">총 {clubs.length}개</span>
          <span className="h-4 w-px bg-neon-border" />
          <span className="text-sm text-neon-text-muted">평균 평점 <strong className="text-neon-text">{avgRating}</strong></span>
        </div>
      </section>

      {/* 인기 장르 섹션 */}
      <section className="mx-auto max-w-[1200px] px-4 pb-4 sm:px-6">
        <h2 className="mb-3 text-base font-bold text-neon-text">이 지역 인기 장르</h2>
        <div className="flex flex-wrap gap-2">
          {GENRE_TAGS.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                selectedGenre === genre
                  ? 'border-purple-500 bg-purple-500 text-white'
                  : 'border-neon-border bg-white text-neon-text-muted hover:border-purple-300'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* 주말 vs 평일 비교 */}
      <section className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
        <div className="rounded-xl border border-neon-border bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-neon-text">주말 vs 평일</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <p className="font-semibold text-purple-700">금-토 (주말)</p>
              <p className="mt-1 text-neon-text-muted">대형 DJ 이벤트, 높은 에너지</p>
              <p className="mt-1 text-xs text-neon-text-muted">인원 많음 / 드레스코드 엄격</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="font-semibold text-blue-700">일-목 (평일)</p>
              <p className="mt-1 text-neon-text-muted">여유로운 분위기, 테마 나이트</p>
              <p className="mt-1 text-xs text-neon-text-muted">할인 혜택 / 자유로운 복장</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
        {selectedGenre && (
          <p className="mb-4 text-sm text-neon-text-muted">
            &quot;{selectedGenre}&quot; 관련 결과 {filteredClubs.length}건
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((venue) => (
            <ClubCard key={venue.id} venue={venue} href={`/clubs/${region}/${venue.slug}`} />
          ))}
        </div>
        {filteredClubs.length === 0 && (
          <p className="py-20 text-center text-neon-text-muted">
            {selectedGenre
              ? `${regionKo}에서 "${selectedGenre}" 장르의 댄스홀을 찾지 못했습니다.`
              : `${regionKo} 지역에 등록된 댄스홀이 없습니다.`}
          </p>
        )}
      </section>
    </div>
  );
}
