import Badge from '@/components/ui/Badge';

interface VenueHeroProps {
  name: string;
  staffNickname?: string;
  rating: number;
  reviewCount: number;
  isPremium: boolean;
  isVerified: boolean;
  category: string;
  regionKo: string;
}

const categoryGradients: Record<string, string> = {
  club: 'from-violet-950/80 via-neon-surface to-neon-bg',
  night: 'from-blue-950/80 via-neon-surface to-neon-bg',
  lounge: 'from-amber-950/80 via-neon-surface to-neon-bg',
  room: 'from-rose-950/80 via-neon-surface to-neon-bg',
  yojeong: 'from-emerald-950/80 via-neon-surface to-neon-bg',
  hoppa: 'from-pink-950/80 via-neon-surface to-neon-bg',
};

const categoryBgPatterns: Record<string, string> = {
  club: 'from-violet-600/20 via-transparent to-transparent',
  night: 'from-blue-600/20 via-transparent to-transparent',
  lounge: 'from-amber-600/20 via-transparent to-transparent',
  room: 'from-rose-600/20 via-transparent to-transparent',
  yojeong: 'from-emerald-600/20 via-transparent to-transparent',
  hoppa: 'from-pink-600/20 via-transparent to-transparent',
};

export default function VenueHero({
  name,
  staffNickname,
  rating,
  reviewCount,
  isPremium,
  isVerified,
  category,
  regionKo,
}: VenueHeroProps) {
  const gradient = categoryGradients[category] || categoryGradients.club;
  const bgPattern = categoryBgPatterns[category] || categoryBgPatterns.club;

  return (
    <section className="relative min-h-[280px] overflow-hidden border-b border-neon-border sm:min-h-[340px]">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${bgPattern}`} />

      {/* Content overlay */}
      <div className="relative mx-auto flex min-h-[280px] max-w-7xl flex-col justify-end px-4 pb-8 sm:min-h-[340px] sm:px-6">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          {isPremium && <Badge variant="premium">PREMIUM</Badge>}
          {isVerified && <Badge variant="verified">인증됨</Badge>}
        </div>

        {/* H1: Venue Name — SEO critical */}
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
          {name}
        </h1>

        {/* Staff Nickname — gold #F59E0B */}
        {staffNickname && (
          <p className="mt-2 text-base font-semibold text-neon-gold sm:text-lg">
            담당: {staffNickname}
          </p>
        )}

        {/* Rating + Region */}
        <div className="mt-3 flex items-center gap-3 text-neon-text-muted">
          <span className="flex items-center gap-1">
            <span className="text-neon-gold">★</span> {rating.toFixed(1)}
          </span>
          {reviewCount > 0 && (
            <>
              <span>·</span>
              <span>리뷰 {reviewCount}개</span>
            </>
          )}
          <span>·</span>
          <span>{regionKo}</span>
        </div>
      </div>
    </section>
  );
}
