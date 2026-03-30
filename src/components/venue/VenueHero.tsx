import { useState } from 'react';
import Badge from '@/components/ui/Badge';

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
  const [hasImage, setHasImage] = useState(true);
  const [imgSrc, setImgSrc] = useState(slug ? `/venues/${slug}-1.jpg` : '');

  const handleImageError = () => {
    if (imgSrc.endsWith('.jpg')) {
      setImgSrc(`/venues/${slug}-1.webp`);
    } else {
      setHasImage(false);
    }
  };

  return (
    <section className="relative min-h-[240px] overflow-hidden border-b border-neon-border sm:min-h-[300px]">
      {/* Real venue image background */}
      {slug && hasImage && (
        <img
          src={imgSrc}
          alt={name}
          width={1200}
          height={630}
          loading="eager"
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
          <p className={`mt-2 text-base font-semibold sm:text-lg ${hasImage && slug ? 'text-yellow-300 drop-shadow' : 'text-neon-gold'}`}>
            담당: {staffNickname}
          </p>
        )}

        <div className={`mt-3 flex items-center gap-3 ${hasImage && slug ? 'text-white/80' : 'text-neon-text-muted'}`}>
          {!name.includes(regionKo) && <span>{regionKo}</span>}
        </div>
      </div>
    </section>
  );
}
