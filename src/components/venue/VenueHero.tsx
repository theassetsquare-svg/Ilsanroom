import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { hasVenueImage } from '@/data/venue-image-manifest';

interface VenueHeroProps {
  name: string;
  staffNickname?: string;
  isPremium: boolean;
  category: string;
  regionKo: string;
  slug?: string;
}

const categoryGradients: Record<string, string> = {
  club: 'from-violet-100 via-neon-bg to-neon-bg',
  night: 'from-blue-100 via-neon-bg to-neon-bg',
  lounge: 'from-amber-100 via-neon-bg to-neon-bg',
  room: 'from-rose-100 via-neon-bg to-neon-bg',
  yojeong: 'from-emerald-100 via-neon-bg to-neon-bg',
  hoppa: 'from-pink-100 via-neon-bg to-neon-bg',
};

const categoryBgPatterns: Record<string, string> = {
  club: 'from-violet-200/30 via-transparent to-transparent',
  night: 'from-blue-200/30 via-transparent to-transparent',
  lounge: 'from-amber-200/30 via-transparent to-transparent',
  room: 'from-rose-200/30 via-transparent to-transparent',
  yojeong: 'from-emerald-200/30 via-transparent to-transparent',
  hoppa: 'from-pink-200/30 via-transparent to-transparent',
};

export default function VenueHero({
  name,
  staffNickname,
  isPremium,
  category,
  regionKo,
  slug,
}: VenueHeroProps) {
  const gradient = categoryGradients[category] || categoryGradients.club;
  const bgPattern = categoryBgPatterns[category] || categoryBgPatterns.club;
  // 시즌29 — manifest로 이미지 보유 여부 사전 확정. 없으면 img 자체 렌더 skip (404 0건).
  const slugHasImage = !!slug && hasVenueImage(slug);
  const [hasImage, setHasImage] = useState(slugHasImage);
  const [imgSrc, setImgSrc] = useState(slugHasImage ? `/venues/${slug}-1.webp` : '');

  const handleImageError = () => {
    if (imgSrc.includes('.webp')) {
      setImgSrc(`/venues/${slug}-1.jpg`);
    } else {
      setHasImage(false);
    }
  };

  return (
    <section className="relative min-h-[240px] overflow-hidden border-b border-neon-border sm:min-h-[300px]">
      {/* Real venue image background — LCP target, eager + high priority */}
      {slug && hasImage && (
        <img
          src={imgSrc}
          alt={name}
          width={1200}
          height={630}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={handleImageError}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Gradient overlay — always shown, heavier when image exists */}
      {hasImage && slug ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${bgPattern}`} />
        </>
      )}

      <div className={`relative mx-auto flex min-h-[240px] max-w-[1200px] flex-col justify-end px-4 pb-8 sm:min-h-[300px] sm:px-6`}>
        <div className="mb-4 flex flex-wrap gap-2">
          {isPremium && <Badge variant="premium">PREMIUM</Badge>}
        </div>

        <h1 className={`text-3xl font-extrabold sm:text-4xl lg:text-5xl ${hasImage && slug ? 'text-white' : 'text-neon-text'}`} style={hasImage && slug ? { textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.4)' } : undefined}>
          {name}
        </h1>

        {staffNickname && (
          <p className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-base font-bold text-[#111] shadow-md sm:text-lg">
              <span className="text-[#8B5CF6]">★</span> 담당: {staffNickname}
            </span>
          </p>
        )}

        <div className={`mt-3 flex items-center gap-3 ${hasImage && slug ? 'text-white' : 'text-neon-text-muted'}`} style={hasImage && slug ? { textShadow: '0 1px 4px rgba(0,0,0,0.6)' } : undefined}>
          {!name.includes(regionKo) && <span>{regionKo}</span>}
        </div>
      </div>
    </section>
  );
}
