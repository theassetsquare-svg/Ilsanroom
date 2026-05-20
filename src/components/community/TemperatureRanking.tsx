import { useEffect, useState } from 'react';
import { Link } from '../ui/SafeLink';
import { createClient } from '@/lib/supabase';
import { getTemperatureLevel } from '@/lib/temperature';

type RankRow = {
  user_id: string;
  nickname: string | null;
  temperature: number;
  rank: number;
};

/**
 * 실시간 온도 랭킹 TOP 10
 * 홈/커뮤니티 사이드바에 노출 → 명예욕족 자극
 */
export function TemperatureRanking({ limit = 10 }: { limit?: number }) {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    (async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, nickname, temperature')
        .order('temperature', { ascending: false })
        .limit(limit);

      if (cancelled || !data) return;

      setRows(
        data.map((d, i) => ({
          user_id: d.user_id,
          nickname: d.nickname,
          temperature: Number(d.temperature ?? 36.5),
          rank: i + 1,
        }))
      );
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [limit]);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
          color: '#FFF',
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>
          🔥 실시간 밤의 온도 TOP {limit}
        </h3>
        <p style={{ fontSize: 11, margin: '2px 0 0', opacity: 0.9 }}>
          누적 활동량 기준 — 글·후기·댓글로 올라간다
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: 18,
              height: 18,
              border: '2px solid #F59E0B',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : rows.length === 0 ? (
        <p style={{ padding: 20, textAlign: 'center', color: '#595959', fontSize: 13 }}>
          아직 랭킹 데이터가 없어요
        </p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((r) => {
            const level = getTemperatureLevel(r.temperature);
            const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : null;
            return (
              <li
                key={r.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderBottom: r.rank < rows.length ? '1px solid #F3F4F6' : 'none',
                  background: r.rank <= 3 ? `${level.color}05` : '#FFF',
                }}
              >
                <span
                  style={{
                    width: 28,
                    fontSize: medal ? 18 : 13,
                    fontWeight: 800,
                    color: r.rank <= 3 ? level.color : '#595959',
                    textAlign: 'center',
                  }}
                >
                  {medal || r.rank}
                </span>
                <span aria-hidden style={{ fontSize: 16 }}>{level.emoji}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#111',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.nickname || '익명회원'}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: level.color,
                    textShadow: level.glow ? `0 0 6px ${level.color}66` : undefined,
                  }}
                >
                  {r.temperature.toFixed(1)}°
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <Link
        to="/ranking"
        style={{
          display: 'block',
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: '#666',
          backgroundColor: '#F9FAFB',
          textDecoration: 'none',
          minHeight: 44,
          lineHeight: '20px',
        }}
      >
        전체 랭킹 보기 →
      </Link>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
