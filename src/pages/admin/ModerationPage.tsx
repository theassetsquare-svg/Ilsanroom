import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];

type Tab = 'reports' | 'hidden' | 'users';

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
  const [hiddenPosts, setHiddenPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
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
    const [r, h, u] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('posts').select('id,user_id,category,title,content,is_hidden,report_count,created_at').eq('is_hidden', true).order('created_at', { ascending: false }).limit(100),
      supabase.from('user_profiles').select('user_id,nickname,level,points,is_banned,ban_reason,banned_at').order('points', { ascending: false }).limit(200),
    ]);
    if (r.error) setMsg({ type: 'err', text: `신고 로드 실패: ${r.error.message}` });
    setReports((r.data || []) as Report[]);
    setHiddenPosts((h.data || []) as Post[]);
    setUsers((u.data || []) as UserRow[]);
    setLoading(false);
  }

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

  // 유저 ban
  async function toggleBan(u: UserRow) {
    const supabase = createClient();
    if (!supabase) return;
    if (!u.is_banned) {
      const reason = prompt(`${u.nickname || u.user_id.slice(0, 8)} 차단 사유:`);
      if (reason === null) return;
      const { error } = await supabase.from('user_profiles').update({
        is_banned: true,
        ban_reason: reason || '사유 없음',
        banned_at: new Date().toISOString(),
      }).eq('user_id', u.user_id);
      if (error) { setMsg({ type: 'err', text: error.message }); return; }
      setMsg({ type: 'ok', text: '차단 완료' });
    } else {
      if (!confirm(`${u.nickname || u.user_id.slice(0, 8)} 차단 해제?`)) return;
      const { error } = await supabase.from('user_profiles').update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
      }).eq('user_id', u.user_id);
      if (error) { setMsg({ type: 'err', text: error.message }); return; }
      setMsg({ type: 'ok', text: '차단 해제' });
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
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-neon-text">모더레이션</h1>
      </div>

      {/* 탭 */}
      <div className="mb-4 flex gap-1 border-b border-neon-border">
        {([
          { k: 'reports', label: `신고 큐${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
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
