import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];

type Tab = 'reports' | 'queue' | 'hidden' | 'users' | 'venues';

// 자동 모더레이션이 "애매하다"고 판단해 경고 없이 쌓아둔 검토 대기 항목
interface QueueItem {
  id: string;
  user_id: string | null;
  target_type: string;
  target_id: string;
  excerpt: string | null;
  reason: string | null;
  status: 'open' | 'approved' | 'dismissed';
  created_at: string;
}

interface VenueReport {
  id: number;
  venue_slug: string;
  reason: string;
  evidence_url: string;
  memo: string | null;
  reporter_ip: string;
  reporter_fingerprint: string;
  status: 'pending' | 'verified' | 'rejected' | 'rebutted' | 'shadowbanned';
  admin_note: string | null;
  created_at: string;
}

const VENUE_REASON_LABEL: Record<string, string> = {
  closed: '폐업',
  wrong_info: '오정보',
  duplicate: '중복',
  scam: '사기·바가지',
  other: '기타',
};

interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'comment' | 'user';
  target_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

interface Post {
  id: string;
  user_id: string | null;
  category: string;
  title: string;
  content: string;
  is_hidden: boolean;
  report_count: number;
  created_at: string;
}

interface UserRow {
  user_id: string;
  nickname: string | null;
  level: string;
  points: number;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
}

const REASON_LABEL: Record<string, string> = {
  profanity: '욕설',
  spam: '스팸',
  false_info: '허위 정보',
  inappropriate: '부적절',
  other: '기타',
};

export default function ModerationPage() {
  useDocumentMeta('모더레이션 — 관리자', '신고 큐 / 숨김 컨텐츠 / 유저 ban 관리');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [tab, setTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [hiddenPosts, setHiddenPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [venueReports, setVenueReports] = useState<VenueReport[]>([]);
  const [venueReportFilter, setVenueReportFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]);

  async function loadAll() {
    setLoading(true);
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const [r, h, u, vr, q] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('posts').select('id,user_id,category,title,content,is_hidden,report_count,created_at').eq('is_hidden', true).order('created_at', { ascending: false }).limit(100),
      supabase.from('user_profiles').select('user_id,nickname,level,points,is_banned,ban_reason,banned_at').order('points', { ascending: false }).limit(200),
      supabase.from('venue_reports').select('id,venue_slug,reason,evidence_url,memo,reporter_ip,reporter_fingerprint,status,admin_note,created_at').order('created_at', { ascending: false }).limit(300),
      supabase.from('moderation_queue').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (r.error) setMsg({ type: 'err', text: `신고 로드 실패: ${r.error.message}` });
    setReports((r.data || []) as Report[]);
    setHiddenPosts((h.data || []) as Post[]);
    setUsers((u.data || []) as UserRow[]);
    setVenueReports((vr.data || []) as VenueReport[]);
    setQueueItems((q.data || []) as QueueItem[]);
    setLoading(false);
  }

  // 검토 큐 처리 — 승인(위반 확정)=숨김+수동 경고 / 기각(문제없음)=아무 조치 0
  async function resolveQueueItem(item: QueueItem, action: 'approved' | 'dismissed') {
    const supabase = createClient();
    if (!supabase) return;
    if (action === 'approved') {
      const table = item.target_type === 'posts' ? 'posts' : item.target_type === 'comments' ? 'comments' : 'reviews';
      const { error: hideErr } = await supabase.from(table).update({ is_hidden: true }).eq('id', item.target_id);
      if (hideErr) { setMsg({ type: 'err', text: `숨김 실패: ${hideErr.message}` }); return; }
      if (item.user_id) {
        const { error: warnErr } = await supabase.rpc('admin_warn_user', {
          target: item.user_id,
          warn_reason: item.reason || '스팸/광고성 게시 확인',
        });
        if (warnErr) { setMsg({ type: 'err', text: `경고 실패: ${warnErr.message}` }); return; }
      }
    }
    const { error } = await supabase.from('moderation_queue')
      .update({ status: action, resolved_at: new Date().toISOString(), resolved_by: user?.id || null })
      .eq('id', item.id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setMsg({ type: 'ok', text: action === 'approved' ? '위반 확정 — 숨김 + 경고 1회' : '문제없음 — 기각 (조치 0)' });
    loadAll();
  }

  // 시즌64 — venue 신고 처리 (verified=폐업 확정 / rejected=무고)
  async function resolveVenueReport(id: number, status: 'verified' | 'rejected', note?: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('venue_reports')
      .update({ status, admin_note: note || null })
      .eq('id', id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setMsg({ type: 'ok', text: status === 'verified' ? '폐업/오정보 확정 (트리거가 reporter 점수 +1)' : '신고 기각 (reporter 점수 -3)' });
    loadAll();
  }

  // threshold 도달 venue 집계 — 같은 venue × 같은 reason × 서로 다른 fp 3+
  const venueThresholds = useMemo(() => {
    const map = new Map<string, { venue_slug: string; reason: string; fps: Set<string>; ids: number[] }>();
    for (const v of venueReports) {
      if (v.status !== 'pending') continue;
      const k = `${v.venue_slug}|${v.reason}`;
      const cur = map.get(k) || { venue_slug: v.venue_slug, reason: v.reason, fps: new Set<string>(), ids: [] };
      cur.fps.add(v.reporter_fingerprint);
      cur.ids.push(v.id);
      map.set(k, cur);
    }
    return Array.from(map.values()).filter(x => x.fps.size >= 3);
  }, [venueReports]);

  const filteredVenueReports = useMemo(() => {
    return venueReportFilter === 'pending'
      ? venueReports.filter(v => v.status === 'pending')
      : venueReports;
  }, [venueReports, venueReportFilter]);

  const venuePendingCount = venueReports.filter(v => v.status === 'pending').length;

  // 신고 처리
  async function resolveReport(id: string, status: 'resolved' | 'dismissed') {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('reports')
      .update({ status, resolved_by: user?.id || null, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setMsg({ type: 'ok', text: status === 'resolved' ? '처리 완료' : '기각' });
    loadAll();
  }

  async function hideTarget(r: Report) {
    if (r.target_type !== 'post' && r.target_type !== 'comment') return;
    const supabase = createClient();
    if (!supabase) return;
    const table = r.target_type === 'post' ? 'posts' : 'comments';
    const { error } = await supabase.from(table).update({ is_hidden: true }).eq('id', r.target_id);
    if (error) { setMsg({ type: 'err', text: `숨김 실패: ${error.message}` }); return; }
    await resolveReport(r.id, 'resolved');
  }

  // 숨김 컨텐츠 unhide
  async function unhide(p: Post) {
    if (!confirm(`복구: "${p.title.slice(0, 40)}"?`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('posts').update({ is_hidden: false }).eq('id', p.id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setMsg({ type: 'ok', text: '복구 완료' });
    loadAll();
  }

  async function deletePost(p: Post) {
    if (!confirm(`영구 삭제: "${p.title.slice(0, 40)}"? (되돌릴 수 없음)`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('posts').delete().eq('id', p.id);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setMsg({ type: 'ok', text: '삭제 완료' });
    loadAll();
  }

  // 유저 ban — 서버 RPC 경유 (정지 + 이메일 재가입 차단 목록까지 함께 처리)
  async function toggleBan(u: UserRow) {
    const supabase = createClient();
    if (!supabase) return;
    if (!u.is_banned) {
      const reason = prompt(`${u.nickname || u.user_id.slice(0, 8)} 차단 사유:`);
      if (reason === null) return;
      const { error } = await supabase.rpc('admin_ban_user', { target: u.user_id, why: reason || '사유 없음' });
      if (error) { setMsg({ type: 'err', text: error.message }); return; }
      setMsg({ type: 'ok', text: '차단 완료 (동일 이메일 재가입 차단 등재)' });
    } else {
      if (!confirm(`${u.nickname || u.user_id.slice(0, 8)} 차단 해제?`)) return;
      const { error } = await supabase.rpc('admin_unban_user', { target: u.user_id });
      if (error) { setMsg({ type: 'err', text: error.message }); return; }
      setMsg({ type: 'ok', text: '차단 해제 (이메일 차단도 해제)' });
    }
    loadAll();
  }

  const filteredReports = useMemo(() => {
    return reportFilter === 'pending' ? reports.filter(r => r.status === 'pending') : reports;
  }, [reports, reportFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.nickname || '').toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (authLoading) return <div className="p-8 text-center text-sm text-neon-text-muted">로딩...</div>;
  if (!user) return <div className="p-8 text-center text-sm text-neon-text-muted">로그인 필요</div>;
  if (!isAdmin) return <div className="p-8 text-center text-sm text-red-400">관리자 권한 필요</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">모더레이션</h1>
        <p className="mt-1 text-xs text-gray-500">신고/숨김/유저 차단 관리</p>
      </div>

      {/* 탭 */}
      <div className="mb-4 flex gap-1 border-b border-neon-border">
        {([
          { k: 'reports', label: `신고 큐${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { k: 'queue', label: `검토 대기${queueItems.filter(x => x.status === 'open').length > 0 ? ` (${queueItems.filter(x => x.status === 'open').length})` : ''}` },
          { k: 'venues', label: `업소 신고${venuePendingCount > 0 ? ` (${venuePendingCount})` : ''}` },
          { k: 'hidden', label: `숨김 컨텐츠 (${hiddenPosts.length})` },
          { k: 'users', label: `유저 (${users.length})` },
        ] as const).map(t => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-bold transition ${tab === t.k ? 'border-b-2 border-neon-primary text-neon-primary-light' : 'text-neon-text-muted hover:text-neon-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${msg.type === 'ok' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {loading && <div className="py-8 text-center text-sm text-neon-text-muted">로딩...</div>}

      {/* 신고 큐 */}
      {tab === 'reports' && !loading && (
        <div>
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setReportFilter('pending')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${reportFilter === 'pending' ? 'bg-neon-primary text-white' : 'bg-neon-bg text-neon-text-muted'}`}
            >
              대기중
            </button>
            <button
              type="button"
              onClick={() => setReportFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${reportFilter === 'all' ? 'bg-neon-primary text-white' : 'bg-neon-bg text-neon-text-muted'}`}
            >
              전체
            </button>
          </div>
          {filteredReports.length === 0 ? (
            <div className="py-12 text-center text-sm text-neon-text-muted">신고 없음 🎉</div>
          ) : (
            <div className="space-y-2">
              {filteredReports.map(r => (
                <div key={r.id} className="rounded-lg border border-neon-border bg-neon-bg p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-bold text-orange-300">{r.target_type}</span>
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-bold text-red-300">{REASON_LABEL[r.reason] || r.reason}</span>
                    <span className={`rounded-full px-2 py-0.5 font-bold ${r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : r.status === 'resolved' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>{r.status}</span>
                    <span className="ml-auto text-neon-text-muted">{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <p className="mb-1 font-mono text-xs text-neon-text-muted">target_id: {r.target_id}</p>
                  <p className="mb-1 font-mono text-xs text-neon-text-muted">reporter: {r.reporter_id?.slice(0, 8) || '-'}</p>
                  {r.description && <p className="mb-2 text-sm text-neon-text">{r.description}</p>}
                  {r.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      {(r.target_type === 'post' || r.target_type === 'comment') && (
                        <button
                          type="button"
                          onClick={() => hideTarget(r)}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30"
                        >
                          숨김 + 처리완료
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => resolveReport(r.id, 'resolved')}
                        className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-bold text-green-300 hover:bg-green-500/30"
                      >
                        처리완료
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveReport(r.id, 'dismissed')}
                        className="rounded-lg bg-gray-500/20 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-gray-500/30"
                      >
                        기각
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 검토 대기 큐 — 자동 모더레이션이 애매하다고 판단한 것 (자동 경고 0, admin 판단만) */}
      {tab === 'queue' && !loading && (
        <div>
          <p className="mb-3 text-xs text-gray-500">
            스팸 의심(링크·연락처·광고문구) 자동 감지분. 글은 정상 발행 상태이며 경고도 없음 — 여기서 admin이 확정할 때만 조치됩니다.
          </p>
          {queueItems.filter(x => x.status === 'open').length === 0 ? (
            <div className="py-12 text-center text-sm text-neon-text-muted">검토 대기 없음 🎉</div>
          ) : (
            <div className="space-y-2">
              {queueItems.filter(x => x.status === 'open').map(item => (
                <div key={item.id} className="rounded-lg border border-neon-border bg-neon-bg p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-bold text-orange-300">{item.target_type}</span>
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 font-bold text-yellow-300">{item.reason || '자동 감지'}</span>
                    <span className="ml-auto text-neon-text-muted">{new Date(item.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <p className="mb-1 font-mono text-xs text-neon-text-muted">target_id: {item.target_id} · user: {item.user_id?.slice(0, 8) || '-'}</p>
                  {item.excerpt && <p className="mb-2 text-sm text-neon-text">{item.excerpt}</p>}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { if (confirm('위반 확정? 글 숨김 + 작성자 경고 1회가 기록됩니다.')) resolveQueueItem(item, 'approved'); }}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30"
                    >
                      위반 확정 (숨김+경고)
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveQueueItem(item, 'dismissed')}
                      className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-bold text-green-300 hover:bg-green-500/30"
                    >
                      문제없음 (기각)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 시즌64 — 업소 신고 (venue_reports) */}
      {tab === 'venues' && !loading && (
        <div>
          {/* threshold 3+ 도달 — admin 즉시 검토 권장 */}
          {venueThresholds.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3">
              <p className="mb-2 text-xs font-bold text-red-700">⚠ threshold 도달 — 서로 다른 신고자 3+ (즉시 검토 권장)</p>
              <ul className="space-y-1 text-xs text-red-700">
                {venueThresholds.map(t => (
                  <li key={`${t.venue_slug}|${t.reason}`}>
                    <strong>{t.venue_slug}</strong> · {VENUE_REASON_LABEL[t.reason] || t.reason} · {t.fps.size}명 일치
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setVenueReportFilter('pending')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${venueReportFilter === 'pending' ? 'bg-neon-primary text-white' : 'bg-neon-bg text-neon-text-muted'}`}
            >대기중 ({venuePendingCount})</button>
            <button
              type="button"
              onClick={() => setVenueReportFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${venueReportFilter === 'all' ? 'bg-neon-primary text-white' : 'bg-neon-bg text-neon-text-muted'}`}
            >전체 ({venueReports.length})</button>
          </div>

          {filteredVenueReports.length === 0 ? (
            <div className="py-12 text-center text-sm text-neon-text-muted">업소 신고 없음 🎉</div>
          ) : (
            <div className="space-y-2">
              {filteredVenueReports.map(v => (
                <div key={v.id} className="rounded-lg border border-neon-border bg-neon-bg p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <a
                      href={`/venue/${v.venue_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-violet-500/20 px-2 py-0.5 font-bold text-violet-300 hover:underline"
                    >{v.venue_slug}</a>
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-bold text-red-300">{VENUE_REASON_LABEL[v.reason] || v.reason}</span>
                    <span className={`rounded-full px-2 py-0.5 font-bold ${v.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : v.status === 'verified' ? 'bg-green-500/20 text-green-300' : v.status === 'rejected' ? 'bg-gray-500/20 text-gray-400' : 'bg-orange-500/20 text-orange-300'}`}>{v.status}</span>
                    <span className="ml-auto text-neon-text-muted">{new Date(v.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <p className="mb-1 text-xs">
                    <a
                      href={v.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-blue-400 hover:underline"
                    >증거: {v.evidence_url}</a>
                  </p>
                  {v.memo && <p className="mb-2 text-sm text-neon-text">{v.memo}</p>}
                  <p className="mb-2 font-mono text-[10px] text-neon-text-muted">ip={v.reporter_ip.slice(0, 12)} · fp={v.reporter_fingerprint.slice(0, 12)}</p>
                  {v.admin_note && <p className="mb-2 rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-300">📝 {v.admin_note}</p>}
                  {v.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const note = prompt('관리자 메모 (선택, 검증 출처 등):') || '';
                          resolveVenueReport(v.id, 'verified', note);
                        }}
                        className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-bold text-green-300 hover:bg-green-500/30"
                      >폐업·오정보 확정</button>
                      <button
                        type="button"
                        onClick={() => {
                          const note = prompt('기각 사유 (reporter 점수 -3):') || '';
                          resolveVenueReport(v.id, 'rejected', note);
                        }}
                        className="rounded-lg bg-gray-500/20 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-gray-500/30"
                      >기각</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 숨김 컨텐츠 */}
      {tab === 'hidden' && !loading && (
        <div>
          {hiddenPosts.length === 0 ? (
            <div className="py-12 text-center text-sm text-neon-text-muted">숨김 컨텐츠 없음</div>
          ) : (
            <div className="space-y-2">
              {hiddenPosts.map(p => (
                <div key={p.id} className="rounded-lg border border-neon-border bg-neon-bg p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-neon-primary/20 px-2 py-0.5 font-bold text-neon-primary-light">{p.category}</span>
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-bold text-red-300">신고 {p.report_count}건</span>
                    <span className="ml-auto text-neon-text-muted">{new Date(p.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <p className="mb-1 text-sm font-bold text-neon-text">{p.title}</p>
                  <p className="mb-2 text-xs text-neon-text-muted line-clamp-2">{p.content}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => unhide(p)}
                      className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-bold text-green-300 hover:bg-green-500/30"
                    >
                      복구
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePost(p)}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30"
                    >
                      영구삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 유저 */}
      {tab === 'users' && !loading && (
        <div>
          <input
            type="text"
            placeholder="닉네임/user_id 검색"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="mb-3 w-64 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary"
          />
          <div className="overflow-x-auto rounded-lg border border-neon-border">
            <table className="w-full text-sm">
              <thead className="bg-neon-bg text-xs text-neon-text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">닉네임</th>
                  <th className="px-3 py-2 text-left">user_id</th>
                  <th className="px-3 py-2 text-left">레벨</th>
                  <th className="px-3 py-2 text-right">포인트</th>
                  <th className="px-3 py-2 text-center">상태</th>
                  <th className="px-3 py-2 text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.user_id} className={`border-t border-neon-border ${u.is_banned ? 'bg-red-500/5' : 'hover:bg-neon-bg/40'}`}>
                    <td className="px-3 py-2 font-bold text-neon-text">{u.nickname || <span className="text-neon-text-muted/50">(없음)</span>}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-neon-text-muted">{u.user_id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-xs text-neon-text-muted">{u.level}</td>
                    <td className="px-3 py-2 text-right text-xs text-neon-text-muted">{u.points.toLocaleString()}</td>
                    <td className="px-3 py-2 text-center">
                      {u.is_banned ? (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-300" title={u.ban_reason || ''}>차단됨</span>
                      ) : (
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-300">정상</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => toggleBan(u)}
                        className={`rounded px-2 py-1 text-xs font-bold ${u.is_banned ? 'text-green-300 hover:bg-green-500/10' : 'text-red-300 hover:bg-red-500/10'}`}
                      >
                        {u.is_banned ? '차단 해제' : '차단'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
