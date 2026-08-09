import { useEffect, useState } from 'react';
import { Link } from '@/components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { venues } from '@/data/venues';
import { createClient } from '@/lib/supabase';
import InlineJoinCard from '@/components/auth/InlineJoinCard';

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

function getHref(v: { category: string; region: string; slug: string }) {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`, night: `/nights/${v.slug}`, lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`, yojeong: `/yojeong/${v.region}/${v.slug}`, hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

/** 파트4 S2b — ⭐내 단골 목록 + 이번 주말 알림 신청(회원 전용). 찜 저장키는 id/slug 혼용이라 둘 다 매칭. */
export default function MyFavoritesPage() {
  useDocumentMeta('내 단골 목록 — 찜해둔 곳만 모아서 다시 보기', '⭐ 찜한 업소를 한 페이지에 모았습니다. 주말 나가기 전에 내 단골 목록에서 바로 전화 걸고 위치 확인하세요. 회원은 이번 주말 알림 신청까지.');
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const favVenues = venues.filter(v => favorites.has(v.id) || favorites.has(v.slug));

  // 주말 알림 신청 상태 (회원 전용, weekend_alert_optins 테이블)
  const [alertOn, setAlertOn] = useState<boolean | null>(null);
  const [alertBusy, setAlertBusy] = useState(false);
  useEffect(() => {
    if (!user) { setAlertOn(null); return; }
    const supabase = createClient();
    if (!supabase) return;
    (supabase.from('weekend_alert_optins') as any)
      .select('user_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }: { data: unknown }) => setAlertOn(!!data), () => setAlertOn(false));
  }, [user]);

  const toggleAlert = async () => {
    if (!user || alertBusy) return;
    const supabase = createClient();
    if (!supabase) return;
    setAlertBusy(true);
    if (alertOn) {
      await (supabase.from('weekend_alert_optins') as any).delete().eq('user_id', user.id);
      setAlertOn(false);
    } else {
      await (supabase.from('weekend_alert_optins') as any).upsert({ user_id: user.id }, { onConflict: 'user_id' });
      setAlertOn(true);
    }
    setAlertBusy(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold" style={{ color: '#111' }}>⭐ 내 단골 목록</h1>
      <p className="mb-6 text-sm" style={{ color: '#777' }}>
        찜한 곳 {favVenues.length}곳. 업소 상세에서 ⭐찜하기를 누르면 여기에 쌓입니다.
      </p>

      {/* 이번 주말 알림 신청 — 회원 전용 */}
      {user ? (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#111' }}>🔔 이번 주말 알림 신청</p>
              <p className="mt-0.5 text-xs" style={{ color: '#888', lineHeight: '1.6' }}>
                주말 전 인기 순위 변동을 알려주는 기능을 준비하고 있어요. 신청해두면 열리는 즉시 자동 적용됩니다.
              </p>
            </div>
            <button
              onClick={toggleAlert}
              disabled={alertBusy || alertOn === null}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.97]"
              style={alertOn
                ? { backgroundColor: '#F3F0FF', color: '#7C3AED', minHeight: 44 }
                : { backgroundColor: '#7C3AED', color: '#fff', minHeight: 44 }}
            >
              {alertOn === null ? '확인 중...' : alertOn ? '신청됨 ✓ (해제)' : '알림 신청'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6"><InlineJoinCard context="favorite" /></div>
      )}

      {favVenues.length === 0 ? (
        <div className="rounded-2xl bg-gray-50 py-14 text-center">
          <p className="text-3xl mb-2">⭐</p>
          <p className="text-sm font-bold mb-1" style={{ color: '#111' }}>아직 찜한 곳이 없어요</p>
          <p className="text-xs mb-4" style={{ color: '#999' }}>마음에 드는 업소 상세에서 ⭐찜하기를 눌러보세요</p>
          <Link to="/ranking" className="inline-flex items-center rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white" style={{ minHeight: 44 }}>
            인기 순위에서 고르기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favVenues.map(v => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <Link to={getHref(v)} className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: '#111' }}>{v.nameKo}</p>
                <p className="text-xs" style={{ color: '#999' }}>{v.regionKo} · {catLabel[v.category] || v.category}</p>
              </Link>
              <button
                onClick={() => toggleFavorite(favorites.has(v.id) ? v.id : v.slug)}
                aria-label={`${v.nameKo} 찜 해제`}
                className="shrink-0 rounded-full px-3 py-2 text-xs font-bold"
                style={{ backgroundColor: '#FEF2F2', color: '#DC2626', minHeight: 44 }}
              >
                해제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
