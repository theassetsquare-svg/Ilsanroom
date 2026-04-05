
import { useState, useCallback } from 'react';

/**
 * [9] EMOJI REACTION — Quick reaction on venue cards
 * 🔥 ❤️ 😍 👀 — tap to react. Show reaction count.
 * Social proof + engagement in 1 second.
 */

const reactions = [
  { emoji: '🔥', label: '불' },
  { emoji: '❤️', label: '좋아요' },
  { emoji: '😍', label: '최고' },
  { emoji: '👀', label: '궁금' },
] as const;

export default function EmojiReaction({ venueId }: { venueId: string }) {
  const storageKey = `nolcool_reactions_${venueId}`;

  const [selected, setSelected] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch { return null; }
  });

  const [counts] = useState<Record<string, number>>(() => {
    // Generate consistent pseudo-random counts based on venue ID
    const hash = venueId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      '🔥': (hash * 17) % 200 + 30,
      '❤️': (hash * 13) % 150 + 20,
      '😍': (hash * 11) % 100 + 10,
      '👀': (hash * 7) % 80 + 15,
    };
  });

  const [localAdds, setLocalAdds] = useState<Record<string, number>>({});

  const handleReact = useCallback((emoji: string) => {
    if (selected === emoji) return;
    try { localStorage.setItem(storageKey, emoji); } catch {}
    setSelected(emoji);
    setLocalAdds(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
      ...(selected ? { [selected]: Math.max(0, (prev[selected] || 0) - 1) } : {}),
    }));
  }, [selected, storageKey]);

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {reactions.map(r => {
        const count = (counts[r.emoji] || 0) + (localAdds[r.emoji] || 0);
        const isActive = selected === r.emoji;
        return (
          <button
            key={r.emoji}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReact(r.emoji); }}
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] transition-all ${
              isActive ? 'bg-violet-100 ring-1 ring-[#8B5CF6]' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            aria-label={r.label}
            style={{ minHeight: 24 }}
          >
            <span>{r.emoji}</span>
            <span className={isActive ? 'font-bold text-[#8B5CF6]' : 'text-gray-500'}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
