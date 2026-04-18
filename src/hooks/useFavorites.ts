import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

const LOCAL_KEY = 'nolcool_favorites';

function getLocalFavorites(): Set<string> {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch { return new Set(); }
}

function saveLocalFavorites(favs: Set<string>) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify([...favs])); } catch {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function favTable(supabase: any) {
  return supabase.from('user_favorites') as any;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(getLocalFavorites);
  const [loading, setLoading] = useState(false);

  // 로그인 유저: Supabase에서 찜 목록 로드
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    favTable(supabase)
      .select('venue_slug')
      .eq('user_id', user.id)
      .then(({ data }: { data: any[] | null }) => {
        if (data && data.length > 0) {
          const dbFavs = new Set(data.map((r: any) => r.venue_slug));
          const localFavs = getLocalFavorites();
          const merged = new Set([...dbFavs, ...localFavs]);

          const toSync = [...localFavs].filter(s => !dbFavs.has(s));
          if (toSync.length > 0) {
            const rows = toSync.map(slug => ({ user_id: user.id, venue_slug: slug }));
            favTable(supabase).upsert(rows, { onConflict: 'user_id,venue_slug' }).then(() => {});
          }

          setFavorites(merged);
          saveLocalFavorites(merged);
        } else {
          const localFavs = getLocalFavorites();
          if (localFavs.size > 0) {
            const rows = [...localFavs].map(slug => ({ user_id: user.id, venue_slug: slug }));
            favTable(supabase).upsert(rows, { onConflict: 'user_id,venue_slug' }).then(() => {});
          }
          setFavorites(localFavs);
        }
        setLoading(false);
      });
  }, [user]);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const isRemoving = next.has(slug);
      if (isRemoving) next.delete(slug); else next.add(slug);
      saveLocalFavorites(next);

      if (user) {
        const supabase = createClient();
        if (supabase) {
          if (isRemoving) {
            favTable(supabase).delete().eq('user_id', user.id).eq('venue_slug', slug).then(() => {});
          } else {
            favTable(supabase).upsert({ user_id: user.id, venue_slug: slug }, { onConflict: 'user_id,venue_slug' }).then(() => {});
          }
        }
      }

      return next;
    });
  }, [user]);

  const isFavorite = useCallback((slug: string) => favorites.has(slug), [favorites]);

  return { favorites, toggleFavorite, isFavorite, loading, count: favorites.size };
}
