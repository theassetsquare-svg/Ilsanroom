import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

/* 홈 커뮤니티 섹션 자동 스위치 (2026-08-09 정직화)
   실제 회원 글이 최근 7일 임계값 이상이면 홈 커뮤니티 섹션 자동 복귀, 미만이면 자동 은닉.
   가짜 글로 홈을 채우지 않는다 — 비어 있는 정직 > 가득 찬 가짜.
   판단 전(로딩)에는 은닉(active=false)이 기본 = 절대 가짜/미확정 상태로 노출하지 않는다. */

// 운영 조정 가능한 임계값 상수
export const COMMUNITY_HOME_MIN_POSTS_7D = 5;

export function useCommunityActive() {
  const [active, setActive] = useState<boolean | null>(null); // null = 판단 전

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) { setActive(false); return; }
    (async () => {
      try {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since)
          .or('is_hidden.is.null,is_hidden.eq.false');
        if (cancelled) return;
        setActive(!error && (count ?? 0) >= COMMUNITY_HOME_MIN_POSTS_7D);
      } catch {
        if (!cancelled) setActive(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { active: active === true, loading: active === null };
}
