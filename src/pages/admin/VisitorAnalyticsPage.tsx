import { useState, useEffect, useCallback } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'baesunwook513@gmail.com', 'theassetsquare@gmail.com'];

interface PageStat {
  path: string;
  views: number;
  avg_dwell_s: number;
  scroll_50_rate: number;
  scroll_100_rate: number;
  exit_rate: number;
}

interface BreakdownRow {
  key: string;
  views: number;
  sessions: number;
}

const SOURCE_LABEL: Record<string, string> = {
  google: '구글', naver: '네이버', kakao: '카카오/다음', daum: '다음',
  bing: '빙', twitter: '트위터/X', facebook: '페이스북', instagram: '인스타',
  youtube: '유튜브', direct: '직접유입', internal: '내부', other: '기타',
};

const DEVICE_LABEL: Record<string, string> = {
  mobile: '모바일', tablet: '태블릿', desktop: 'PC',
};

export default function VisitorAnalyticsPage() {
  useDocumentMeta('방문자 행동 분석 — 체류·이탈·전환', '페이지별 체류 시간, 스크롤 깊이, 이탈 지점, 유입 채널, 디바이스, UTM 캠페인, 가입 전환 분석. 1초 이탈 진단과 채널별 ROI 측정용 운영진 전용 도구.');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [stats, setStats] = useState<PageStat[]>([]);
  const [sources, setSources] = useState<BreakdownRow[]>([]);
  const [devices, setDevices] = useState<BreakdownRow[]>([]);
  const [campaigns, setCampaigns] = useState<BreakdownRow[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [signups, setSignups] = useState(0);
  const [shareClicks, setShareClicks] = useState(0);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);

    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data, error } = await supabase
      .from('page_events')
      .select('session_id, path, event_type, dwell_ms, source_type, device_type, utm_campaign')
      .gte('created_at', since)
      .limit(20000);

    if (error || !data) { setLoading(false); return; }

    const byPath: Record<string, { views: number; dwellSum: number; dwellN: number; s50: number; s100: number; exitFast: number; exitTotal: number }> = {};
    const sessions = new Set<string>();
    const sourceMap: Record<string, { views: number; sessions: Set<string> }> = {};
    const deviceMap: Record<string, { views: number; sessions: Set<string> }> = {};
    const campaignMap: Record<string, { views: number; sessions: Set<string> }> = {};
    let views = 0;
    let signupCount = 0;
    let shareCount = 0;

    for (const r of data) {
      sessions.add(r.session_id);
      const p = r.path || '/';
      if (!byPath[p]) byPath[p] = { views: 0, dwellSum: 0, dwellN: 0, s50: 0, s100: 0, exitFast: 0, exitTotal: 0 };
      const b = byPath[p];
      if (r.event_type === 'view') {
        b.views++; views++;
        const src = r.source_type || 'direct';
        if (!sourceMap[src]) sourceMap[src] = { views: 0, sessions: new Set() };
        sourceMap[src].views++; sourceMap[src].sessions.add(r.session_id);
        const dev = r.device_type || 'desktop';
        if (!deviceMap[dev]) deviceMap[dev] = { views: 0, sessions: new Set() };
        deviceMap[dev].views++; deviceMap[dev].sessions.add(r.session_id);
        if (r.utm_campaign) {
          if (!campaignMap[r.utm_campaign]) campaignMap[r.utm_campaign] = { views: 0, sessions: new Set() };
          campaignMap[r.utm_campaign].views++; campaignMap[r.utm_campaign].sessions.add(r.session_id);
        }
      }
      if (r.event_type === 'scroll_50') b.s50++;
      if (r.event_type === 'scroll_100') b.s100++;
      if (r.event_type === 'exit' && typeof r.dwell_ms === 'number') {
        b.dwellSum += r.dwell_ms; b.dwellN++; b.exitTotal++;
        if (r.dwell_ms < 30_000) b.exitFast++;
      }
      if (r.event_type === 'signup') signupCount++;
      if (r.event_type === 'share_click') shareCount++;
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

    const toBreakdown = (m: Record<string, { views: number; sessions: Set<string> }>): BreakdownRow[] =>
      Object.entries(m)
        .map(([key, v]) => ({ key, views: v.views, sessions: v.sessions.size }))
        .sort((a, b) => b.views - a.views);

    setStats(rows);
    setSources(toBreakdown(sourceMap));
    setDevices(toBreakdown(deviceMap));
    setCampaigns(toBreakdown(campaignMap));
    setTotalSessions(sessions.size);
    setTotalViews(views);
    setSignups(signupCount);
    setShareClicks(shareCount);
    setLoading(false);
  }, [hours]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (authLoading) return <div className="p-8 text-center" style={{ color: '#888' }}>로딩 중...</div>;
  if (!isAdmin) return <div className="p-8 text-center" style={{ color: '#888' }}>관리자만 접근 가능합니다.</div>;

  const conversionRate = totalSessions > 0 ? ((signups / totalSessions) * 100).toFixed(2) : '0.00';

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: '#111' }}>방문자 행동 분석</h1>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        어디서 들어오고, 어디서 머물고, 어디서 떠나는지 한눈에 봅니다.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
        <button
          onClick={load}
          style={{ padding: '8px 14px', borderRadius: '8px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          새로고침
        </button>
        <button
          onClick={async () => {
            if (!confirm('지금까지 쌓인 모든 page_events 로그를 삭제합니다. (관리자/봇 테스트 데이터 제거)\n계속할까요?')) return;
            const supabase = createClient();
            if (!supabase) return;
            const { error } = await supabase.from('page_events').delete().gt('id', 0);
            if (error) { alert('삭제 실패: ' + error.message); return; }
            alert('완료. 이제부터 진짜 방문자만 기록됩니다.');
            load();
          }}
          style={{ padding: '8px 14px', borderRadius: '8px', background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          오염 데이터 초기화
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '16px', background: '#F9F9F9', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>방문 세션</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111' }}>{totalSessions.toLocaleString()}</div>
        </div>
        <div style={{ padding: '16px', background: '#F9F9F9', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>총 페이지뷰</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111' }}>{totalViews.toLocaleString()}</div>
        </div>
        <div style={{ padding: '16px', background: '#FFF1F2', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>가입 전환</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626' }}>{signups}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>전환율 {conversionRate}%</div>
        </div>
        <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>친구 공유 클릭</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#B45309' }}>{shareClicks}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ padding: '16px', background: '#fff', border: '1px solid #EEE', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#111' }}>유입 채널</div>
          {sources.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#999' }}>데이터 없음</div>
          ) : (
            <table style={{ width: '100%', fontSize: '12px' }}>
              <tbody>
                {sources.map(s => {
                  const pct = totalViews > 0 ? Math.round((s.views / totalViews) * 100) : 0;
                  return (
                    <tr key={s.key} style={{ borderBottom: '1px solid #F5F5F5' }}>
                      <td style={{ padding: '6px 0', color: '#333' }}>{SOURCE_LABEL[s.key] || s.key}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', color: '#666' }}>{s.sessions} 세션</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#111', width: '40px' }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '16px', background: '#fff', border: '1px solid #EEE', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#111' }}>디바이스</div>
          {devices.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#999' }}>데이터 없음</div>
          ) : (
            <table style={{ width: '100%', fontSize: '12px' }}>
              <tbody>
                {devices.map(d => {
                  const pct = totalViews > 0 ? Math.round((d.views / totalViews) * 100) : 0;
                  return (
                    <tr key={d.key} style={{ borderBottom: '1px solid #F5F5F5' }}>
                      <td style={{ padding: '6px 0', color: '#333' }}>{DEVICE_LABEL[d.key] || d.key}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', color: '#666' }}>{d.sessions} 세션</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#111', width: '40px' }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '16px', background: '#fff', border: '1px solid #EEE', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#111' }}>UTM 캠페인</div>
          {campaigns.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#999' }}>아직 UTM 태그 유입 없음</div>
          ) : (
            <table style={{ width: '100%', fontSize: '12px' }}>
              <tbody>
                {campaigns.slice(0, 8).map(c => (
                  <tr key={c.key} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '6px 0', color: '#333', fontFamily: 'monospace' }}>{c.key}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#666' }}>{c.sessions} 세션</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#111' }}>{c.views} 뷰</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
          <li><strong>유입 채널:</strong> 어느 검색엔진/SNS에서 들어왔는지. 직접유입이 많으면 브랜드 인지도 ↑.</li>
          <li><strong>UTM 캠페인:</strong> ?utm_campaign=xxx 태그 단 링크의 성과. 광고/배너별 ROI 비교.</li>
          <li><strong>가입 전환율:</strong> 방문 세션 대비 가입 비율. 1% 이상이면 양호.</li>
          <li><strong>30초전이탈 70% 이상 (빨강):</strong> 그 페이지에 문제 있음. 첫 화면이 매력 없거나 로딩 느림.</li>
        </ul>
      </div>
    </div>
  );
}
