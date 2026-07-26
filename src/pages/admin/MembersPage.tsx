import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];

type Tab = 'warnings' | 'banned' | 'rejoin';

interface WarningRow {
  id: string;
  user_id: string;
  source: 'auto' | 'admin';
  reason: string;
  target_type: string | null;
  target_id: string | null;
  excerpt: string | null;
  created_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
}

interface BannedEmailRow {
  id: string;
  email: string;
  user_id: string | null;
  reason: string | null;
  banned_at: string;
  unbanned_at: string | null;
}

interface RejoinRow {
  id: string;
  email: string;
  user_id: string | null;
  detected_at: string;
}

// PII 최소 — 화면 표시용 이메일 마스킹
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email.slice(0, 2) + '***';
  const maskedLocal = local.length <= 2 ? `${local.charAt(0)}*` : `${local.slice(0, 2)}${'*'.repeat(Math.min(local.length - 2, 5))}`;
  return `${maskedLocal}@${domain}`;
}

export default function MembersPage() {
  useDocumentMeta('회원 관리 — 관리자', '경고 이력 / 이메일 차단 목록 / 재가입 감지 로그');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [tab, setTab] = useState<Tab>('warnings');
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [bannedEmails, setBannedEmails] = useState<BannedEmailRow[]>([]);
  const [rejoins, setRejoins] = useState<RejoinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [warnTarget, setWarnTarget] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [warnFilter, setWarnFilter] = useState<'active' | 'all'>('active');

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]);

  async function loadAll() {
    setLoading(true);
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const [w, b, r] = await Promise.all([
      supabase.from('user_warnings').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('banned_emails').select('*').order('banned_at', { ascending: false }).limit(300),
      supabase.from('rejoin_attempts').select('*').order('detected_at', { ascending: false }).limit(300),
    ]);
    if (w.error) setMsg({ type: 'err', text: `경고 로드 실패: ${w.error.message}` });
    setWarnings((w.data || []) as WarningRow[]);
    setBannedEmails((b.data || []) as BannedEmailRow[]);
    setRejoins((r.data || []) as RejoinRow[]);
    setLoading(false);
  }

  // 수동 경고 — 서버 RPC(is_admin 검증), 3회 누적 시 자동 정지까지 서버가 처리
  async function warnUser() {
    const target = warnTarget.trim();
    const reason = warnReason.trim();
    if (!target || !reason) { setMsg({ type: 'err', text: 'user_id와 사유를 모두 입력하세요' }); return; }
    if (!confirm(`이 회원에게 경고 1회를 기록할까요?\n사유: ${reason}`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc('admin_warn_user', { target, warn_reason: reason });
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setMsg({ type: 'ok', text: `경고 기록 완료 (누적 ${data}회${Number(data) >= 3 ? ' — 자동 정지됨' : ''})` });
    setWarnTarget('');
    setWarnReason('');
    loadAll();
  }

  // 경고 취소 — 오판 복구 (누적 카운트에서 즉시 제외)
  async function revokeWarning(w: WarningRow) {
    const why = prompt('취소 사유 (오판 복구 기록):');
    if (why === null) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.rpc('admin_revoke_warning', { wid: w.id, why: why || 'admin revoke' });
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setMsg({ type: 'ok', text: '경고 취소 완료 (누적에서 제외)' });
    loadAll();
  }

  // 이메일 차단 해제 — 해당 회원 정지도 함께 해제
  async function unbanEmail(b: BannedEmailRow) {
    if (!confirm(`${maskEmail(b.email)} 차단 해제? (계정 정지도 함께 해제됩니다)`)) return;
    const supabase = createClient();
    if (!supabase) return;
    if (b.user_id) {
      const { error } = await supabase.rpc('admin_unban_user', { target: b.user_id });
      if (error) { setMsg({ type: 'err', text: error.message }); return; }
    } else {
      const { error } = await supabase.from('banned_emails')
        .update({ unbanned_at: new Date().toISOString() }).eq('id', b.id);
      if (error) { setMsg({ type: 'err', text: error.message }); return; }
    }
    setMsg({ type: 'ok', text: '차단 해제 완료' });
    loadAll();
  }

  const filteredWarnings = useMemo(() => (
    warnFilter === 'active' ? warnings.filter(w => !w.revoked_at) : warnings
  ), [warnings, warnFilter]);

  const activeWarnCount = warnings.filter(w => !w.revoked_at).length;
  const activeBannedCount = bannedEmails.filter(b => !b.unbanned_at).length;

  if (authLoading) return <div className="p-8 text-center text-sm text-gray-500">로딩...</div>;
  if (!user) return <div className="p-8 text-center text-sm text-gray-500">로그인 필요</div>;
  if (!isAdmin) return <div className="p-8 text-center text-sm text-red-500">관리자 권한 필요</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <p className="mt-1 text-xs text-gray-500">경고 이력 · 이메일 차단 · 재가입 감지 (경고 3회 = 자동 정지)</p>
      </div>

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {([
          { k: 'warnings', label: `경고 이력 (${activeWarnCount})` },
          { k: 'banned', label: `차단 이메일 (${activeBannedCount})` },
          { k: 'rejoin', label: `재가입 감지 (${rejoins.length})` },
        ] as const).map(t => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-bold transition ${tab === t.k ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {loading && <div className="py-8 text-center text-sm text-gray-500">로딩...</div>}

      {/* 경고 이력 */}
      {tab === 'warnings' && !loading && (
        <div>
          {/* 수동 경고 */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs font-bold text-gray-700">수동 경고 기록</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="user_id (UUID)"
                value={warnTarget}
                onChange={e => setWarnTarget(e.target.value)}
                className="w-72 rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="사유"
                value={warnReason}
                onChange={e => setWarnReason(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={warnUser}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
              >
                경고 +1
              </button>
            </div>
          </div>

          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setWarnFilter('active')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${warnFilter === 'active' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}
            >유효 ({activeWarnCount})</button>
            <button
              type="button"
              onClick={() => setWarnFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${warnFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}
            >전체 ({warnings.length})</button>
          </div>

          {filteredWarnings.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">경고 이력 없음 🎉</div>
          ) : (
            <div className="space-y-2">
              {filteredWarnings.map(w => (
                <div key={w.id} className={`rounded-lg border p-3 ${w.revoked_at ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-gray-200 bg-white'}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-bold ${w.source === 'auto' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                      {w.source === 'auto' ? '자동' : '수동'}
                    </span>
                    {w.revoked_at && <span className="rounded-full bg-gray-200 px-2 py-0.5 font-bold text-gray-600">취소됨</span>}
                    <span className="ml-auto text-gray-400">{new Date(w.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <p className="mb-1 font-mono text-xs text-gray-500">
                    user: {w.user_id.slice(0, 8)}{w.target_type ? ` · ${w.target_type}/${(w.target_id || '').slice(0, 8)}` : ''}
                  </p>
                  <p className="mb-1 text-sm font-bold text-gray-900">{w.reason}</p>
                  {w.excerpt && <p className="mb-2 text-xs text-gray-500 line-clamp-2">"{w.excerpt}"</p>}
                  {w.revoked_at ? (
                    <p className="text-xs text-gray-400">취소: {w.revoked_reason || '-'} ({new Date(w.revoked_at).toLocaleString('ko-KR')})</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revokeWarning(w)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
                    >
                      경고 취소 (오판 복구)
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 차단 이메일 */}
      {tab === 'banned' && !loading && (
        <div>
          <p className="mb-3 text-xs text-gray-500">
            정지 시 자동 등재. 동일 이메일 재가입 = 즉시 자동 재정지. (정직 한계: 다른 이메일 우회 가입은 100% 차단 불가 — 감지·재정지가 최선)
          </p>
          {bannedEmails.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">차단 이메일 없음 🎉</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">이메일</th>
                    <th className="px-3 py-2 text-left">사유</th>
                    <th className="px-3 py-2 text-left">차단일</th>
                    <th className="px-3 py-2 text-center">상태</th>
                    <th className="px-3 py-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {bannedEmails.map(b => (
                    <tr key={b.id} className="border-t border-gray-200">
                      <td className="px-3 py-2 font-mono text-xs text-gray-900">{maskEmail(b.email)}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{b.reason || '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{new Date(b.banned_at).toLocaleDateString('ko-KR')}</td>
                      <td className="px-3 py-2 text-center">
                        {b.unbanned_at ? (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">해제됨</span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">차단중</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!b.unbanned_at && (
                          <button
                            type="button"
                            onClick={() => unbanEmail(b)}
                            className="rounded px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-50"
                          >
                            해제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 재가입 감지 */}
      {tab === 'rejoin' && !loading && (
        <div>
          <p className="mb-3 text-xs text-gray-500">차단 이메일로 재가입 시도 시 자동 기록 + 즉시 재정지 처리된 로그입니다.</p>
          {rejoins.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">재가입 시도 없음 🎉</div>
          ) : (
            <div className="space-y-2">
              {rejoins.map(r => (
                <div key={r.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-700">재가입 감지 → 자동 재정지</span>
                    <span className="font-mono text-gray-700">{maskEmail(r.email)}</span>
                    {r.user_id && <span className="font-mono text-gray-500">new user: {r.user_id.slice(0, 8)}</span>}
                    <span className="ml-auto text-gray-400">{new Date(r.detected_at).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
