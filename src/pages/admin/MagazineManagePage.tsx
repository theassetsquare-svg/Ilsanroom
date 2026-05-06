import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import { articles as localArticles } from '@/data/magazine-articles';

const RichEditor = lazy(() => import('@/components/admin/RichEditor'));

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];
const TAGS = ['분석', '요정', '클럽', '나이트', '룸', '라운지', '호빠', '가이드', '트렌드', '리포트'];

interface Article {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  content: string;
  cover_image?: string | null;
  is_published?: boolean;
  view_count?: number;
  updated_at?: string;
  created_at?: string;
}

const empty: Partial<Article> = {
  id: '', title: '', excerpt: '', tag: '분석',
  date: new Date().toISOString().slice(0, 10),
  content: '<p></p>', cover_image: '', is_published: true,
};

const inputCls = 'w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary';

export default function MagazineManagePage() {
  useDocumentMeta('매거진 에디터 — 관리자', '매거진 글 작성/수정/발행 + 위지위그 본문 에디터');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('magazine_articles').select('*').order('date', { ascending: false });
    if (error) setMsg({ type: 'err', text: `로드 실패: ${error.message}` });
    setArticles((data || []) as Article[]);
    setLoading(false);
  }

  async function importLocalArticles() {
    if (!confirm(`로컬 데이터 ${localArticles.length}개 글을 DB로 복사합니다. 같은 id가 있으면 덮어쓰지 않습니다.`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const payload = localArticles.map(a => ({
      id: a.id, title: a.title, excerpt: a.excerpt,
      tag: a.tag, date: a.date, content: a.content,
      is_published: true,
    }));
    const { error } = await supabase.from('magazine_articles').upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
    if (error) { setMsg({ type: 'err', text: `가져오기 실패: ${error.message}` }); return; }
    setMsg({ type: 'ok', text: `${payload.length}개 글 가져오기 완료` });
    load();
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.id || !editing.title || !editing.date) {
      setMsg({ type: 'err', text: 'id, 제목, 날짜는 필수입니다' });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setSaving(true);
    setMsg(null);

    const payload = {
      id: editing.id, title: editing.title, excerpt: editing.excerpt || '',
      tag: editing.tag || '분석', date: editing.date, content: editing.content || '',
      cover_image: editing.cover_image || null,
      is_published: editing.is_published !== false,
    };

    if (isNew) {
      const { error } = await supabase.from('magazine_articles').insert(payload);
      if (error) { setMsg({ type: 'err', text: `추가 실패: ${error.message}` }); setSaving(false); return; }
      setMsg({ type: 'ok', text: '글 추가 완료' });
    } else {
      const { error } = await supabase.from('magazine_articles').update(payload).eq('id', editing.id);
      if (error) { setMsg({ type: 'err', text: `수정 실패: ${error.message}` }); setSaving(false); return; }
      setMsg({ type: 'ok', text: '글 수정 완료' });
    }
    setSaving(false);
    setEditing(null);
    setIsNew(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('magazine_articles').delete().eq('id', id);
    if (error) { setMsg({ type: 'err', text: `삭제 실패: ${error.message}` }); return; }
    setMsg({ type: 'ok', text: '삭제 완료' });
    load();
  }

  async function togglePublish(a: Article) {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('magazine_articles').update({ is_published: !a.is_published }).eq('id', a.id);
    load();
  }

  const filtered = useMemo(() => {
    return articles
      .filter(a => filterTag === 'all' || a.tag === filterTag)
      .filter(a => filterStatus === 'all' || (filterStatus === 'published' ? a.is_published : !a.is_published))
      .filter(a => !search || a.title.includes(search) || a.id.includes(search));
  }, [articles, filterTag, filterStatus, search]);

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" /></div>;
  if (!user || !isAdmin) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="mb-4 text-2xl font-bold">관리자 전용</h1>
      <a target="_blank" rel="noopener noreferrer" href="/login" className="inline-block rounded-xl bg-neon-primary px-6 py-3 text-sm font-bold text-white">로그인</a>
    </div>
  );

  // ─── 편집 화면 ───
  if (editing) {
    const liveUrl = `/magazine/${editing.id}`;
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => { setEditing(null); setIsNew(false); setMsg(null); }} className="text-sm text-neon-primary hover:underline">← 매거진 목록</button>
          {!isNew && editing.id && (
            <a target="_blank" rel="noopener noreferrer" href={liveUrl} className="rounded-lg border border-neon-border px-3 py-1.5 text-xs hover:bg-neon-surface-2">사이트 미리보기 ↗</a>
          )}
        </div>
        <h1 className="mb-4 text-2xl font-bold">{isNew ? '새 글 작성' : editing.title}</h1>
        {msg && <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${msg.type === 'err' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-500'}`}>{msg.text}</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* 메인 */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-neon-border bg-neon-surface p-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neon-text-muted">제목 *</label>
                  <input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className={`${inputCls} text-lg font-bold`} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neon-text-muted">id (URL slug) * <span className="text-neon-text-muted/70">— /magazine/{editing.id || 'xxxx'}</span></label>
                  <input value={editing.id || ''} disabled={!isNew}
                    onChange={e => setEditing({ ...editing, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className={`${inputCls} font-mono ${!isNew ? 'opacity-60' : ''}`} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neon-text-muted">발췌 (excerpt) — 목록·SEO 노출</label>
                  <textarea rows={3} value={editing.excerpt || ''} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} className={inputCls} />
                  <p className="mt-1 text-[11px] text-neon-text-muted">{(editing.excerpt || '').length}자 (150자 권장)</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neon-border bg-neon-surface p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neon-text-muted">본문 (위지위그)</h2>
              <Suspense fallback={<div className="h-[400px] rounded-lg bg-neon-bg" />}>
                <RichEditor value={editing.content || '<p></p>'} onChange={html => setEditing({ ...editing, content: html })} />
              </Suspense>
              <p className="mt-2 text-[11px] text-neon-text-muted">{(editing.content || '').replace(/<[^>]+>/g, '').length}자 본문</p>
            </section>
          </div>

          {/* 사이드바 */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">발행</h3>
              <div className="space-y-3 text-sm">
                <label className="flex items-center justify-between">
                  <span>발행 상태</span>
                  <input type="checkbox" checked={editing.is_published !== false} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} />
                </label>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neon-text-muted">날짜 *</label>
                  <input type="date" value={editing.date || ''} onChange={e => setEditing({ ...editing, date: e.target.value })} className={inputCls} />
                </div>
                {editing.updated_at && (
                  <p className="border-t border-neon-border/50 pt-2 text-[11px] text-neon-text-muted">
                    마지막 수정: {new Date(editing.updated_at).toLocaleString('ko-KR')}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-neon-primary-light disabled:opacity-60">
                    {saving ? '저장 중...' : isNew ? '발행' : '저장'}
                  </button>
                  {!isNew && editing.id && (
                    <button onClick={() => handleDelete(editing.id!)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20">삭제</button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">카테고리</h3>
              <select value={editing.tag || '분석'} onChange={e => setEditing({ ...editing, tag: e.target.value })} className={inputCls}>
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">대표 이미지</h3>
              <input value={editing.cover_image || ''} onChange={e => setEditing({ ...editing, cover_image: e.target.value })} placeholder="/og/..." className={inputCls} />
              {editing.cover_image && (
                <div className="mt-3 overflow-hidden rounded-lg border border-neon-border" style={{ aspectRatio: '16/9' }}>
                  <img src={editing.cover_image} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            {!isNew && (
              <div className="rounded-2xl border border-neon-border bg-neon-surface p-4 text-sm">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">통계</h3>
                <div className="flex justify-between text-neon-text-muted">
                  <span>조회수</span><span className="font-mono text-neon-text">{editing.view_count || 0}</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // ─── 목록 ───
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">매거진 에디터</h1>
          <p className="mt-1 text-sm text-neon-text-muted">총 {articles.length}개 · 필터 {filtered.length}개</p>
        </div>
        <div className="flex gap-2">
          {articles.length === 0 && (
            <button onClick={importLocalArticles} className="rounded-xl border border-neon-border px-4 py-2.5 text-sm hover:bg-neon-surface-2">
              로컬 {localArticles.length}개 가져오기
            </button>
          )}
          <button onClick={() => { setEditing({ ...empty }); setIsNew(true); setMsg(null); }} className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-primary-light">
            + 새 글
          </button>
        </div>
      </div>

      {msg && <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${msg.type === 'err' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-500'}`}>{msg.text}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm">
          <option value="all">전체 카테고리</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm">
          <option value="all">전체 상태</option>
          <option value="published">발행됨</option>
          <option value="draft">초안</option>
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목·id 검색" className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm focus:border-neon-primary" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neon-border bg-neon-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-border text-neon-text-muted">
                <th className="px-3 py-3 text-left font-medium">제목</th>
                <th className="px-3 py-3 text-left font-medium">카테고리</th>
                <th className="px-3 py-3 text-left font-medium">날짜</th>
                <th className="px-3 py-3 text-center font-medium">발행</th>
                <th className="px-3 py-3 text-right font-medium">조회</th>
                <th className="px-3 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-neon-border/50 last:border-0 hover:bg-neon-bg/50">
                  <td className="px-3 py-3">
                    <button onClick={() => { setEditing({ ...a }); setIsNew(false); setMsg(null); }} className="font-medium text-left hover:text-neon-primary">{a.title}</button>
                    <p className="text-[11px] text-neon-text-muted font-mono">{a.id}</p>
                  </td>
                  <td className="px-3 py-3"><span className="rounded-full bg-neon-primary/10 px-2 py-0.5 text-xs text-neon-primary-light">{a.tag}</span></td>
                  <td className="px-3 py-3 font-mono text-xs text-neon-text-muted">{a.date}</td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => togglePublish(a)} className={`rounded-full px-3 py-0.5 text-xs font-medium ${a.is_published ? 'bg-green-500/20 text-green-500' : 'bg-neon-surface-2 text-neon-text-muted'}`}>
                      {a.is_published ? '발행' : '초안'}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-neon-text-muted">{a.view_count || 0}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <a target="_blank" rel="noopener noreferrer" href={`/magazine/${a.id}`} className="rounded bg-neon-surface-2 px-2 py-1 text-xs hover:bg-neon-bg">↗</a>
                      <button onClick={() => { setEditing({ ...a }); setIsNew(false); setMsg(null); }} className="rounded bg-neon-primary/10 px-2 py-1 text-xs text-neon-primary-light hover:bg-neon-primary/20">수정</button>
                      <button onClick={() => handleDelete(a.id)} className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neon-text-muted">
                  {articles.length === 0 ? 'DB에 글이 없습니다 — "로컬 N개 가져오기" 버튼으로 초기화' : '검색 결과가 없습니다'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
