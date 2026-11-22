import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

/* 창립멤버 시스템 — 첫 100명 가입자 영구 ⭐ 뱃지
   가입 순서(user_profiles.joined_at)는 서버 함수 founding_member_info() 가 센다(놀쿨86-1 · 함수가 없으면 숫자를 보이지 않음).
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
        // [놀쿨86-1 · 2026-11-22] 가입자 수 · 내 순번은 서버 함수 하나로 읽는다. 표(user_profiles)를 바로 세면
        //   보안 규칙(자기 줄만 보임) 때문에 손님에게는 0명, 회원에게는 자기 한 명만 세어져
        //   「100자리 남음」 · 「#1」이 사실과 다르게 나왔다(실제 가입 19명 · 11-22 실측). 함수가 없거나 실패하면 숫자를 보이지 않는다.
        const { data, error } = await (supabase.rpc('founding_member_info') as any);
        if (cancelled || error || !data) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (typeof row?.total === 'number') setTotalCount(row.total);
        if (userId && typeof row?.my_number === 'number') setMyNumber(row.my_number);
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
