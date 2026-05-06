import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import { invalidatePageBlocksCache } from '@/hooks/usePageBlock';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];

interface Row {
  id?: string;
  page_key: string;
  block_key: string;
  value: string;
  is_html: boolean;
  enabled: boolean;
  note: string | null;
  updated_at?: string;
}

const empty: Row = {
  page_key: 'home',
  block_key: '',
  value: '',
  is_html: false,
  enabled: true,
  note: '',
};

// 사이트에서 사용 중인 블록 — 카탈로그 (관리자가 어떤 키가 있는지 알 수 있도록)
const KNOWN_BLOCKS: { page: string; key: string; label: string; default: string }[] = [
  { page: 'home', key: 'hero_h1', label: '홈 히어로 H1 (시간대 자동 문구 덮어쓰기)', default: '오늘 밤, 어디 갈래?' },
  { page: 'home', key: 'hero_subtitle', label: '홈 히어로 서브타이틀 (없으면 미표시)', default: '' },
];

const inputCls = 'w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary';
const labelCls = 'mb-1 block text-xs font-bold text-neon-text-muted';

export default function PageBlocksPage() {
  useDocumentMeta('페이지 블록 에디터 — 관리자', '페이지별 텍스트 블록 코드 수정 없이 변경');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterPage, setFilterPage] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('page_blocks')
      .select('*')
      .order('page_key', { ascending: true })
      .order('block_key', { ascending: true });
    if (error) setMsg({ type: 'err', text: `로드 실패: ${error.message}` });
    setRows((data || []) as Row[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.page_key || !editing.block_key) {
      setMsg({ type: 'err', text: 'page_key, block_key 필수' });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const payload = {
      page_key: editing.page_key.trim(),
      block_key: editing.block_key.trim(),
      value: editing.value || '',
      is_html: editing.is_html,
      enabled: editing.enabled,
      note: editing.note?.trim() || null,
      updated_by: user?.id || null,
    };
    let error;
    if (isNew) {
      ({ error } = await supabase.from('page_blocks').upsert(payload, { onConflict: 'page_key,block_key' }));
    } else {
      ({ error } = await supabase.from('page_blocks').update(payload).eq('id', editing.id));
    }
    if (error) { setMsg({ type: 'err', text: `저장 실패: ${error.message}` }); return; }
    invalidatePageBlocksCache();
    setMsg({ type: 'ok', text: '저장 완료 — 새로고침 시 반영' });
    setEditing(null);
    setIsNew(false);
    load();
  }

  async function handleDelete(row: Row) {
    if (!row.id) return;
    if (!confirm(`삭제: ${row.page_key}.${row.block_key}? (코드 기본값으로 복구됨)`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('page_blocks').delete().eq('id', row.id);
    if (error) { setMsg({ type: 'err', text: `삭제 실패: ${error.message}` }); return; }
    invalidatePageBlocksCache();
    setMsg({ type: 'ok', text: '삭제 완료' });
    load();
  }

  async function toggleEnabled(row: Row) {
    if (!row.id) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('page_blocks').update({ enabled: !row.enabled }).eq('id', row.id);
    invalidatePageBlocksCache();
    load();
  }

  function quickAdd(b: typeof KNOWN_BLOCKS[number]) {
    const existing = rows.find(r => r.page_key === b.page && r.block_key === b.key);
    if (existing) {
      setEditing({ ...existing });
      setIsNew(false);
    } else {
      setEditing({ ...empty, page_key: b.page, block_key: b.key, value: b.default, note: b.label });
      setIsNew(true);
    }
  }

  const pageKeys = useMemo(() => Array.from(new Set(rows.map(r => r.page_key))).sort(), [rows]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filterPage !== 'all' && r.page_key !== filterPage) return false;
      if (q && !`${r.page_key}.${r.block_key} ${r.value} ${r.note || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filterPage, search]);

  if (authLoading) return <div className="p-8 text-center text-sm text-neon-text-muted">로딩...</div>;
  if (!user) return <div className="p-8 text-center text-sm text-neon-text-muted">로그인 필요</div>;
  if (!isAdmin) return <div className="p-8 text-center text-sm text-red-400">관리자 권한 필요</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">페이지 블록 에디터</h1>
          <p className="mt-1 text-xs text-gray-500">총 {rows.length}개 블록</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          + 새 블록
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterPage}
          onChange={e => setFilterPage(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500"
        >
          <option value="all">전체 페이지</option>
          {pageKeys.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="text"
          placeholder="검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-500"
        />
      </div>

      {/* 카탈로그 — 사용 중인 블록 키 안내 */}
      <div className="mb-4 rounded-lg border border-neon-border bg-neon-bg-elevated p-3">
        <p className="mb-2 text-xs font-bold text-neon-text-muted">⚡ 빠른 편집 — 사이트에서 사용 중인 블록</p>
        <div className="flex flex-wrap gap-2">
          {KNOWN_BLOCKS.map(b => {
            const exists = rows.some(r => r.page_key === b.page && r.block_key === b.key && r.enabled);
            return (
              <button
                key={`${b.page}.${b.key}`}
                type="button"
                onClick={() => quickAdd(b)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${exists ? 'border-neon-primary/50 bg-neon-primary/10 text-neon-primary-light' : 'border-neon-border text-neon-text-muted hover:border-neon-primary/30 hover:text-neon-text'}`}
                title={b.label}
              >
                {exists && '● '}{b.page}.{b.key}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-neon-text-muted">● 표시 = 현재 활성 오버라이드. 클릭해서 편집/생성.</p>
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
          {rows.length === 0 ? '블록 없음. 위 빠른 편집 버튼 또는 [+ 새 블록].' : '검색 결과 없음'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neon-border">
          <table className="w-full text-sm">
            <thead className="bg-neon-bg text-xs text-neon-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">page.block</th>
                <th className="px-3 py-2 text-left">value</th>
                <th className="px-3 py-2 text-left">메모</th>
                <th className="px-3 py-2 text-center">활성</th>
                <th className="px-3 py-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="border-t border-neon-border hover:bg-neon-bg/40">
                  <td className="px-3 py-2 font-mono text-xs text-neon-primary-light">{row.page_key}.{row.block_key}{row.is_html && <span className="ml-1 rounded bg-orange-500/20 px-1 text-orange-300">HTML</span>}</td>
                  <td className="px-3 py-2 text-neon-text">
                    <div className="max-w-md truncate">{row.value || <span className="text-neon-text-muted/50">(빈 값)</span>}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-neon-text-muted">
                    <div className="max-w-xs truncate">{row.note || <span className="opacity-50">—</span>}</div>
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
              {isNew ? '새 페이지 블록' : `편집: ${editing.page_key}.${editing.block_key}`}
            </h2>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>page_key *</label>
                <input
                  type="text"
                  value={editing.page_key}
                  onChange={e => setEditing({ ...editing, page_key: e.target.value })}
                  placeholder="home, clubs, lounges 등"
                  className={inputCls}
                  disabled={!isNew}
                />
              </div>
              <div>
                <label className={labelCls}>block_key *</label>
                <input
                  type="text"
                  value={editing.block_key}
                  onChange={e => setEditing({ ...editing, block_key: e.target.value })}
                  placeholder="hero_h1, cta_text 등"
                  className={inputCls}
                  disabled={!isNew}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className={labelCls}>value (텍스트 또는 HTML)</label>
              <textarea
                value={editing.value}
                onChange={e => setEditing({ ...editing, value: e.target.value })}
                rows={6}
                className={inputCls + ' font-mono text-xs'}
                placeholder="여기에 표시될 내용"
              />
              <p className="mt-1 text-[11px] text-neon-text-muted">{editing.value.length}자</p>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_html"
                checked={editing.is_html}
                onChange={e => setEditing({ ...editing, is_html: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="is_html" className="text-sm text-neon-text">HTML로 렌더 (책임은 관리자)</label>
            </div>

            <div className="mb-3">
              <label className={labelCls}>관리 메모</label>
              <input
                type="text"
                value={editing.note || ''}
                onChange={e => setEditing({ ...editing, note: e.target.value })}
                placeholder="예) 5월 시즌 캠페인 — 6/1 OFF 예정"
                className={inputCls}
              />
            </div>

            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="block-enabled"
                checked={editing.enabled}
                onChange={e => setEditing({ ...editing, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="block-enabled" className="text-sm text-neon-text">활성화</label>
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
