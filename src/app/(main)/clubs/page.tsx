import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export const metadata: Metadata = {
  title: '클럽 | NEON - EDM · 힙합 · 테크노 전국 인기 클럽 정보',
  description:
    '대한민국 전국 인기 클럽 정보를 한눈에. 강남 EDM 클럽, 홍대 힙합 클럽, 이태원 글로벌 클럽까지 장르별·지역별 클럽 리스트와 DJ 스케줄, 입장 정보를 확인하세요.',
};

function VenueCard({ venue, href }: { venue: Venue; href: string }) {
  return (
    <Card href={href}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <span>{venue.regionKo}</span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-500">★</span> {venue.rating}
          <span className="text-neutral-600">({venue.reviewCount})</span>
        </span>
      </div>
      <p className="text-sm leading-relaxed text-neutral-500 line-clamp-2">{venue.shortDescription}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {venue.tags.slice(0, 3).map((tag) => (
          <Badge key={tag}>#{tag}</Badge>
        ))}
      </div>
    </Card>
  );
}

export default function ClubsPage() {
  const clubs = getVenuesByCategory('club');

  return (
    <div className="bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/15 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-sm font-medium tracking-wider text-violet-400">CLUB</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">클럽</h1>
          <p className="mt-4 max-w-2xl text-neutral-400">
            EDM, 힙합, 테크노, 하우스 — 장르별 최고의 클럽을 찾아보세요
          </p>
        </div>
      </section>

      {/* Genre Tags */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-3">
          {['EDM', '힙합', 'R&B', '테크노', '하우스', '글로벌'].map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300"
            >
              {genre}
            </span>
          ))}
        </div>
      </section>

      {/* Intro Text */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6">
          <h2 className="mb-3 text-lg font-bold text-white">한국 클럽 씬 완벽 가이드</h2>
          <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
            <p>
              한국 클럽 문화는 2000년대 초반 홍대를 중심으로 본격적인 성장기를 맞이했습니다.
              초기에는 소규모 라이브 하우스 위주였으나, 2010년대 들어 강남 옥타곤을 필두로
              대형 클럽이 등장하면서 아시아 클럽 문화의 중심축으로 자리매김했습니다.
              EDM 페스티벌의 급성장과 함께 세계적인 DJ들이 한국을 정기적으로 방문하게 되었고,
              힙합 씬의 폭발적 성장은 장르 전문 클럽의 탄생을 이끌었습니다.
            </p>
            <p>
              현재 서울의 클럽 지도는 홍대(인디·얼터너티브), 강남(메가클럽·VIP),
              이태원(글로벌·다문화)이라는 세 축으로 나뉘며, 각 지역마다 뚜렷한 음악적
              정체성을 가지고 있습니다. 사운드 시스템은 Funktion-One, d&b audiotechnik 등
              세계 정상급 장비를 도입한 곳이 대부분이며, 조명과 영상 연출 수준도
              글로벌 스탠다드에 도달했습니다. NEON에서 각 클럽의 장르, 분위기, DJ 스케줄을
              확인하고 나에게 맞는 파티를 찾아보세요.
            </p>
          </div>
        </div>
      </section>

      {/* Venue Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">전체 클럽 ({clubs.length})</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((venue) => (
            <VenueCard key={venue.id} venue={venue} href={`/clubs/${venue.region}/${venue.slug}`} />
          ))}
        </div>
        {clubs.length === 0 && (
          <p className="py-20 text-center text-neutral-600">등록된 클럽이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
