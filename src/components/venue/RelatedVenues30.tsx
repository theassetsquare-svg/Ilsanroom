import { useMemo, useState } from 'react';
import { Link } from '../ui/SafeLink';
import type { Venue, VenueCategory } from '@/types';
import { venues as allVenues } from '@/data/venues';

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };

function getHref(v: Venue): string {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`,
    night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`,
    hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

interface Section {
  title: string;
  emoji: string;
  items: Venue[];
}

interface Props {
  venue: Venue;
}

export default function RelatedVenues30({ venue }: Props) {
  const [expanded, setExpanded] = useState(false);
  const active = allVenues.filter(v => v.id !== venue.id && v.status !== 'closed_or_unclear');

  const sections = useMemo((): Section[] => {
    // 1. 같은 카테고리
    const sameCategory = active.filter(v => v.category === venue.category).slice(0, 5);

    // 2. 같은 지역
    const sameRegion = active.filter(v => v.region === venue.region && !sameCategory.includes(v)).slice(0, 5);

    // 3. 비슷한 분위기 (태그 매칭)
    const venueTags = new Set(venue.tags.map(t => t.toLowerCase()));
    const scored = active
      .filter(v => !sameCategory.includes(v) && !sameRegion.includes(v))
      .map(v => ({
        venue: v,
        score: v.tags.filter(t => venueTags.has(t.toLowerCase())).length,
      }))
      .sort((a, b) => b.score - a.score);
    const similarVibe = scored.slice(0, 5).map(s => s.venue);

    // 4. 다른 카테고리 인기
    const usedIds = new Set([...sameCategory, ...sameRegion, ...similarVibe].map(v => v.id));
    const otherCategory = active.filter(v => v.category !== venue.category && !usedIds.has(v.id)).slice(0, 5);

    // 5. 프리미엄 업소
    const usedIds2 = new Set([...Array.from(usedIds), ...otherCategory.map(v => v.id)]);
    const premium = active.filter(v => v.isPremium && !usedIds2.has(v.id)).slice(0, 5);

    // 6. 이번 주 인기 (slug 해시 기반 시드로 매주 다르게)
    const weekSeed = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const usedIds3 = new Set([...Array.from(usedIds2), ...premium.map(v => v.id)]);
    const weeklyHot = active
      .filter(v => !usedIds3.has(v.id))
      .sort((a, b) => {
        const ha = a.slug.split('').reduce((s, c) => s + c.charCodeAt(0), weekSeed);
        const hb = b.slug.split('').reduce((s, c) => s + c.charCodeAt(0), weekSeed);
        return (hb % 100) - (ha % 100);
      })
      .slice(0, 5);

    return [
      { title: `같은 ${catLabel[venue.category] || '업종'}`, emoji: catEmoji[venue.category] || '🔥', items: sameCategory },
      { title: `${venue.regionKo} 지역`, emoji: '📍', items: sameRegion },
      { title: '비슷한 분위기', emoji: '✨', items: similarVibe },
      { title: '다른 업종도 둘러보기', emoji: '🔄', items: otherCategory },
      { title: '프리미엄 추천', emoji: '💎', items: premium },
      { title: '이번 주 인기', emoji: '🔥', items: weeklyHot },
    ].filter(s => s.items.length > 0);
  }, [venue.id]);

  const visibleSections = expanded ? sections : sections.slice(0, 2);
  const totalCards = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#111' }}>
          {venue.nameKo} 보는 사람들이 함께 본 곳
        </h2>
        <p className="text-xs mt-1" style={{ color: '#888' }}>
          {totalCards}개 업소 비교하고 딱 맞는 곳 찾기
        </p>
      </div>

      {visibleSections.map((section, si) => (
        <div key={si} className="mb-8">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#333' }}>
            <span>{section.emoji}</span>
            <span>{section.title}</span>
            <span className="text-xs font-normal" style={{ color: '#999' }}>({section.items.length})</span>
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible">
            {section.items.map(v => (
              <Link
                key={v.id}
                to={getHref(v)}
                className="shrink-0 w-[140px] sm:w-auto rounded-xl border p-3 transition hover:shadow-md"
                style={{ borderColor: '#E5E7EB', backgroundColor: '#FFF' }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">{catEmoji[v.category]}</span>
                  <span className="text-[10px] font-medium" style={{ color: '#8B5CF6' }}>{catLabel[v.category]}</span>
                </div>
                <p className="text-sm font-bold truncate" style={{ color: '#111' }}>{v.nameKo}</p>
                <p className="text-xs truncate" style={{ color: '#888' }}>{v.regionKo}</p>
                {v.staffNickname && (
                  <p className="text-[10px] mt-1 truncate" style={{ color: '#D4A843' }}>{v.staffNickname}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}

      {!expanded && sections.length > 2 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full rounded-xl py-3 text-sm font-bold transition"
          style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6', border: '1px solid #E9E5FF', minHeight: 44 }}
        >
          {totalCards}개 업소 더 보기
        </button>
      )}
    </section>
  );
}
