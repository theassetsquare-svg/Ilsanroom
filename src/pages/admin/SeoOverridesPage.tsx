import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import { invalidateSeoOverrideCache } from '@/hooks/useSeoOverride';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];

interface Row {
  id?: string;
  path: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  canonical: string | null;
  robots: string | null;
  enabled: boolean;
  note: string | null;
  updated_at?: string;
}

const empty: Row = {
  path: '/',
  title: '', description: '',
  og_image: '', canonical: '', robots: '',
  enabled: true, note: '',
};

const inputCls = 'w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary';
const labelCls = 'mb-1 block text-xs font-bold text-neon-text-muted';

export default function SeoOverridesPage() {
  useDocumentMeta('SEO 메타 에디터 — 관리자', '페이지별 title/description/OG/canonical/robots 덮어쓰기');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('seo_overrides')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) setMsg({ type: 'err', text: `로드 실패: ${error.message}` });
    setRows((data || []) as Row[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.path || !editing.path.startsWith('/')) {
      setMsg({ type: 'err', text: 'path는 / 로 시작해야 합니다 (예: /, /clubs, /lounges/garosu)' });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    const payload = {
      path: editing.path.trim(),
      title: editing.title?.trim() || null,
      description: editing.description?.trim() || null,
      og_image: editing.og_image?.trim() || null,
      canonical: editing.canonical?.trim() || null,
      robots: editing.robots?.trim() || null,
      enabled: editing.enabled,
      note: editing.note?.trim() || null,
      updated_by: user?.id || null,
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from('seo_overrides').insert(payload));
    } else {
      ({ error } = await supabase.from('seo_overrides').update(payload).eq('id', editing.id));
    }
    if (error) { setMsg({ type: 'err', text: `저장 실패: ${error.message}` }); return; }
    setMsg({ type: 'ok', text: '저장 완료' });
    invalidateSeoOverrideCache();
    setEditing(null);
    setIsNew(false);
    load();
  }

  async function handleDelete(row: Row) {
    if (!row.id) return;
    if (!confirm(`삭제: ${row.path}?`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('seo_overrides').delete().eq('id', row.id);
    if (error) { setMsg({ type: 'err', text: `삭제 실패: ${error.message}` }); return; }
    invalidateSeoOverrideCache();
    setMsg({ type: 'ok', text: '삭제 완료' });
    load();
  }

  async function toggleEnabled(row: Row) {
    if (!row.id) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('seo_overrides').update({ enabled: !row.enabled }).eq('id', row.id);
    invalidateSeoOverrideCache();
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.path.toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.note || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  if (authLoading) return <div className="p-8 text-center text-sm text-neon-text-muted">로딩...</div>;
  if (!user) return <div className="p-8 text-center text-sm text-neon-text-muted">로그인 필요</div>;
  if (!isAdmin) return <div className="p-8 text-center text-sm text-red-400">관리자 권한 필요</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-neon-text">SEO 메타 에디터</h1>
        <span className="text-xs text-neon-text-muted">총 {rows.length}개 오버라이드</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="path/title/메모 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-56 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary"
          />
          <button
            type="button"
            onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
            className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white hover:bg-neon-primary-light"
          >
            + 새 오버라이드
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-neon-border bg-neon-bg-elevated p-3 text-xs text-neon-text-muted">
        💡 <strong className="text-neon-text">사용법</strong>: 페이지 코드 수정 없이 특정 URL의 title/description/og:image/canonical/robots를 덮어씁니다.
        예) <code className="bg-neon-bg px-1 rounded">/clubs</code>의 title을 시즌 이벤트로 임시 교체. enabled OFF로 즉시 끔.
      </div>

      {msg && (
        <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${msg.type === 'ok' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-neon-text-muted">로딩...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-neon-text-muted">
          {rows.length === 0 ? '오버라이드 없음. 위 [+ 새 오버라이드] 버튼으로 시작.' : '검색 결과 없음'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neon-border">
          <table className="w-full text-sm">
            <thead className="bg-neon-bg text-xs text-neon-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">path</th>
                <th className="px-3 py-2 text-left">title</th>
                <th className="px-3 py-2 text-left">description</th>
                <th className="px-3 py-2 text-left">기타</th>
                <th className="px-3 py-2 text-center">활성</th>
                <th className="px-3 py-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="border-t border-neon-border hover:bg-neon-bg/40">
                  <td className="px-3 py-2 font-mono text-xs text-neon-primary-light">{row.path}</td>
                  <td className="px-3 py-2 text-neon-text">
                    <div className="max-w-xs truncate">{row.title || <span className="text-neon-text-muted/50">—</span>}</div>
                  </td>
                  <td className="px-3 py-2 text-neon-text-muted">
                    <div className="max-w-sm truncate">{row.description || <span className="opacity-50">—</span>}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-neon-text-muted">
                    {[
                      row.og_image && 'OG',
                      row.canonical && 'CANON',
                      row.robots && `robots:${row.robots}`,
                    ].filter(Boolean).join(' · ') || <span className="opacity-50">—</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleEnabled(row)}
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {row.enabled ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => { setEditing({ ...row }); setIsNew(false); }}
                      className="rounded px-2 py-1 text-xs text-neon-primary-light hover:bg-neon-bg"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="ml-1 rounded px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 편집 모달 */}
      {editing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => { setEditing(null); setIsNew(false); }}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-xl border border-neon-border bg-neon-bg-elevated p-5"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-4 text-base font-bold text-neon-text">
              {isNew ? '새 SEO 오버라이드' : `편집: ${editing.path}`}
            </h2>

            <div className="mb-3">
              <label className={labelCls}>URL path *</label>
              <input
                type="text"
                value={editing.path}
                onChange={e => setEditing({ ...editing, path: e.target.value })}
                placeholder="/clubs 또는 /lounges/garosu"
                className={inputCls}
                disabled={!isNew}
              />
              {!isNew && <p className="mt-1 text-[11px] text-neon-text-muted">기존 path 변경 불가 (삭제 후 재생성)</p>}
            </div>

            <div className="mb-3">
              <label className={labelCls}>title (~60자)</label>
              <input
                type="text"
                value={editing.title || ''}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                placeholder="비우면 페이지 기본 title 사용"
                className={inputCls}
                maxLength={120}
              />
              <p className="mt-1 text-[11px] text-neon-text-muted">{(editing.title || '').length}/60자 권장</p>
            </div>

            <div className="mb-3">
              <label className={labelCls}>description (~160자)</label>
              <textarea
                value={editing.description || ''}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
                placeholder="비우면 페이지 기본 description 사용"
                rows={3}
                className={inputCls}
                maxLength={200}
              />
              <p className="mt-1 text-[11px] text-neon-text-muted">{(editing.description || '').length}/160자 권장</p>
            </div>

            <div className="mb-3">
              <label className={labelCls}>og:image (절대 URL)</label>
              <input
                type="text"
                value={editing.og_image || ''}
                onChange={e => setEditing({ ...editing, og_image: e.target.value })}
                placeholder="https://nolcool.com/og/... (미디어 라이브러리에서 복사)"
                className={inputCls}
              />
            </div>

            <div className="mb-3">
              <label className={labelCls}>canonical (절대 URL)</label>
              <input
                type="text"
                value={editing.canonical || ''}
                onChange={e => setEditing({ ...editing, canonical: e.target.value })}
                placeholder="https://nolcool.com/clubs (중복 페이지 통합 시)"
                className={inputCls}
              />
            </div>

            <div className="mb-3">
              <label className={labelCls}>robots</label>
              <select
                value={editing.robots || ''}
                onChange={e => setEditing({ ...editing, robots: e.target.value })}
                className={inputCls}
              >
                <option value="">기본 (index, follow)</option>
                <option value="index, follow">index, follow</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
            </div>

            <div className="mb-3">
              <label className={labelCls}>관리 메모 (왜 덮어쓰는지)</label>
              <input
                type="text"
                value={editing.note || ''}
                onChange={e => setEditing({ ...editing, note: e.target.value })}
                placeholder="예) 5월 시즌 캠페인 — 6월 1일 OFF 예정"
                className={inputCls}
              />
            </div>

            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={editing.enabled}
                onChange={e => setEditing({ ...editing, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="enabled" className="text-sm text-neon-text">활성화 (체크 해제 시 즉시 OFF)</label>
            </div>

            <div className="flex justify-end gap-2 border-t border-neon-border pt-4">
              <button
                type="button"
                onClick={() => { setEditing(null); setIsNew(false); }}
                className="rounded-lg border border-neon-border px-3 py-2 text-xs font-bold text-neon-text hover:bg-neon-bg"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-neon-primary px-4 py-2 text-xs font-bold text-white hover:bg-neon-primary-light"
              >
                {isNew ? '추가' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
