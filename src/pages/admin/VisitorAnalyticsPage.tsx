import { useState, useEffect, useCallback } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'baesunwook513@gmail.com', 'theassetsquare@gmail.com'];

interface PageStat {
  path: string;
  views: number;
  avg_dwell_s: number;
  scroll_50_rate: number;   // 50% 이상 스크롤 비율
  scroll_100_rate: number;
  exit_rate: number;        // 30초 미만 이탈률
}

export default function VisitorAnalyticsPage() {
  useDocumentMeta('방문자 행동 분석 — 체류·이탈·전환', '페이지별 체류 시간, 스크롤 깊이, 이탈 지점, 클릭 히트맵, 디바이스·OS·유입 채널 분석 데이터. 1초 이탈 페이지 진단과 개선 우선순위 결정용 운영진 전용 도구.');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [stats, setStats] = useState<PageStat[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);

    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data, error } = await supabase
      .from('page_events')
      .select('session_id, path, event_type, dwell_ms')
      .gte('created_at', since)
      .limit(20000);

    if (error || !data) { setLoading(false); return; }

    // 집계
    const byPath: Record<string, { views: number; dwellSum: number; dwellN: number; s50: number; s100: number; exitFast: number; exitTotal: number }> = {};
    const sessions = new Set<string>();
    let views = 0;
    for (const r of data) {
      sessions.add(r.session_id);
      const p = r.path || '/';
      if (!byPath[p]) byPath[p] = { views: 0, dwellSum: 0, dwellN: 0, s50: 0, s100: 0, exitFast: 0, exitTotal: 0 };
      const b = byPath[p];
      if (r.event_type === 'view') { b.views++; views++; }
      if (r.event_type === 'scroll_50') b.s50++;
      if (r.event_type === 'scroll_100') b.s100++;
      if (r.event_type === 'exit' && typeof r.dwell_ms === 'number') {
        b.dwellSum += r.dwell_ms; b.dwellN++; b.exitTotal++;
        if (r.dwell_ms < 30_000) b.exitFast++;
      }
    }

    const rows: PageStat[] = Object.entries(byPath)
      .map(([path, b]) => ({
        path,
        views: b.views,
        avg_dwell_s: b.dwellN > 0 ? Math.round(b.dwellSum / b.dwellN / 1000) : 0,
        scroll_50_rate: b.views > 0 ? Math.round((b.s50 / b.views) * 100) : 0,
        scroll_100_rate: b.views > 0 ? Math.round((b.s100 / b.views) * 100) : 0,
        exit_rate: b.exitTotal > 0 ? Math.round((b.exitFast / b.exitTotal) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 50);

    setStats(rows);
    setTotalSessions(sessions.size);
    setTotalViews(views);
    setLoading(false);
  }, [hours]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (authLoading) return <div className="p-8 text-center" style={{ color: '#888' }}>로딩 중...</div>;
  if (!isAdmin) return <div className="p-8 text-center" style={{ color: '#888' }}>관리자만 접근 가능합니다.</div>;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: '#111' }}>방문자 행동 분석</h1>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        어느 페이지에서 사람들이 머물고, 어디서 떠나는지 한눈에 봅니다.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[6, 24, 72, 168].map(h => (
          <button
            key={h}
            onClick={() => setHours(h)}
            style={{
              padding: '8px 14px', borderRadius: '8px',
              background: hours === h ? '#FF2E93' : '#F0F0F0',
              color: hours === h ? '#fff' : '#333',
              border: 'none', cursor: 'pointer', fontWeight: 600,
            }}
          >
            최근 {h < 24 ? `${h}시간` : `${h / 24}일`}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '16px', background: '#F9F9F9', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>방문 세션</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111' }}>{totalSessions.toLocaleString()}</div>
        </div>
        <div style={{ padding: '16px', background: '#F9F9F9', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>총 페이지뷰</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111' }}>{totalViews.toLocaleString()}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>집계 중...</div>
      ) : stats.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          아직 데이터가 없습니다. 사이트 방문이 쌓이면 여기에 표시됩니다.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F0F0F0', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>경로</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>뷰</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>평균체류</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>50%스크롤</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>끝까지</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>30초전이탈</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(r => (
                <tr key={r.path} style={{ borderBottom: '1px solid #EEE' }}>
                  <td style={{ padding: '10px', color: '#111', fontFamily: 'monospace' }}>{r.path}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{r.views}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{r.avg_dwell_s}초</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: r.scroll_50_rate >= 30 ? '#16A34A' : '#888' }}>
                    {r.scroll_50_rate}%
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: r.scroll_100_rate >= 10 ? '#16A34A' : '#888' }}>
                    {r.scroll_100_rate}%
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: r.exit_rate >= 70 ? '#DC2626' : '#888' }}>
                    {r.exit_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '24px', padding: '16px', background: '#FFF8E1', borderRadius: '12px', fontSize: '13px', color: '#666' }}>
        <strong>읽는 법:</strong>
        <ul style={{ margin: '8px 0 0 16px', lineHeight: 1.7 }}>
          <li><strong>30초전이탈 70% 이상 (빨강):</strong> 그 페이지에 문제 있음. 첫 화면이 매력 없거나 로딩 느림.</li>
          <li><strong>50%스크롤 30% 이상 (초록):</strong> 사람들이 본문을 보고 있음.</li>
          <li><strong>끝까지 10% 이상 (초록):</strong> 콘텐츠가 재미있다는 신호.</li>
        </ul>
      </div>
    </div>
  );
}
