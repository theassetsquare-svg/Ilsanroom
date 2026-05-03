import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

/* 창립멤버 시스템 — 첫 100명 가입자 영구 ⭐ 뱃지
   user_profiles.joined_at 순서로 ROW_NUMBER 계산. 스키마 변경 0.
   - totalCount: 총 가입자 수 (1명 미만이면 100자리 모두 빈 자리)
   - myNumber: 현재 로그인 사용자의 가입 순번 (없으면 null)
   - isFounder: myNumber <= 100 */

const FOUNDER_LIMIT = 100;

export function useFoundingMember(userId?: string | null) {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [myNumber, setMyNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // 1. 총 가입자 수 (count)
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        if (cancelled) return;
        setTotalCount(count ?? 0);

        // 2. 내 순번 (joined_at 기준)
        if (userId) {
          const { data: me } = await supabase
            .from('user_profiles')
            .select('joined_at')
            .eq('user_id', userId)
            .single();
          if (cancelled) return;
          if (me?.joined_at) {
            const { count: ahead } = await supabase
              .from('user_profiles')
              .select('*', { count: 'exact', head: true })
              .lte('joined_at', me.joined_at);
            if (!cancelled) setMyNumber(ahead ?? null);
          }
        }
      } catch {
        // silent — 런칭 직후 RLS/오류 시 그냥 null
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const isFounder = myNumber !== null && myNumber <= FOUNDER_LIMIT;
  const remaining = totalCount === null ? null : Math.max(0, FOUNDER_LIMIT - totalCount);

  return { totalCount, myNumber, isFounder, remaining, loading, founderLimit: FOUNDER_LIMIT };
}
