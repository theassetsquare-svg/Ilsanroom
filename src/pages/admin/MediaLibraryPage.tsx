import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];
const PAGE_SIZE = 60;

interface Media {
  id: string;
  bucket: string;
  path: string;
  public_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  alt_text: string | null;
  created_at: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(2)}MB`;
}

export default function MediaLibraryPage() {
  useDocumentMeta('미디어 라이브러리 — 관리자', '이미지 업로드/관리/삭제 + URL 복사');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [selected, setSelected] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE * 4);
    if (error) setMsg({ type: 'err', text: `로드 실패: ${error.message}` });
    setItems((data || []) as Media[]);
    setLoading(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const supabase = createClient();
    const session = (await supabase?.auth.getSession())?.data.session;
    if (!session) { setMsg({ type: 'err', text: '세션 없음' }); return; }

    setUploading(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/media-upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: fd,
        });
        const json = await res.json() as { success?: boolean; error?: string };
        if (json.success) ok++; else { fail++; console.error(json.error); }
      } catch (e) {
        fail++;
        console.error(e);
      }
    }
    setUploading(false);
    setMsg({ type: ok > 0 ? 'ok' : 'err', text: `업로드 ${ok}개 성공${fail ? `, ${fail}개 실패` : ''}` });
    if (ok > 0) load();
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(m: Media) {
    if (!confirm(`삭제: ${m.file_name}?\n(되돌릴 수 없음)`)) return;
    const supabase = createClient();
    const session = (await supabase?.auth.getSession())?.data.session;
    if (!session) return;
    const res = await fetch('/api/media-delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id }),
    });
    const json = await res.json() as { success?: boolean; error?: string };
    if (json.success) {
      setMsg({ type: 'ok', text: '삭제 완료' });
      setItems(prev => prev.filter(x => x.id !== m.id));
      if (selected?.id === m.id) setSelected(null);
    } else {
      setMsg({ type: 'err', text: `삭제 실패: ${json.error}` });
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(
      () => setMsg({ type: 'ok', text: 'URL 복사됨' }),
      () => setMsg({ type: 'err', text: '복사 실패' }),
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(m =>
      m.file_name.toLowerCase().includes(q) ||
      (m.alt_text || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  if (authLoading) return <div className="p-8 text-center text-sm text-neon-text-muted">로딩...</div>;
  if (!user) return <div className="p-8 text-center text-sm text-neon-text-muted">로그인 필요</div>;
  if (!isAdmin) return <div className="p-8 text-center text-sm text-red-400">관리자 권한 필요</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">미디어 라이브러리</h1>
          <p className="mt-1 text-xs text-gray-500">총 {items.length}개</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
          id="media-upload-input"
        />
        <label
          htmlFor="media-upload-input"
          className={`cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {uploading ? '업로드 중…' : '+ 이미지 업로드'}
        </label>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="파일명/alt 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-500"
        />
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
          {items.length === 0 ? '아직 업로드된 이미지가 없습니다. 위 [+ 이미지 업로드] 버튼으로 시작하세요.' : '검색 결과 없음'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-neon-border bg-neon-bg transition hover:border-neon-primary"
            >
              <img
                src={m.public_url}
                alt={m.alt_text || m.file_name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left opacity-0 transition group-hover:opacity-100">
                <p className="truncate text-[11px] text-white">{m.file_name}</p>
                <p className="text-[10px] text-white/70">{formatBytes(m.file_size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-neon-border bg-neon-bg-elevated p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-neon-text">{selected.file_name}</h2>
                <p className="mt-1 text-xs text-neon-text-muted">
                  {selected.mime_type} · {formatBytes(selected.file_size)} · {new Date(selected.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-neon-text-muted hover:bg-neon-bg hover:text-neon-text"
              >
                ✕
              </button>
            </div>

            <img
              src={selected.public_url}
              alt={selected.alt_text || selected.file_name}
              className="mb-4 max-h-[50vh] w-full rounded-lg object-contain"
            />

            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold text-neon-text-muted">URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={selected.public_url}
                  className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-xs text-neon-text outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyUrl(selected.public_url)}
                  className="rounded-lg bg-neon-primary px-3 py-2 text-xs font-bold text-white hover:bg-neon-primary-light"
                >
                  복사
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold text-neon-text-muted">{`<img>`} 태그</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`<img src="${selected.public_url}" alt="${selected.alt_text || ''}" />`}
                  className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-xs text-neon-text outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyUrl(`<img src="${selected.public_url}" alt="${selected.alt_text || ''}" />`)}
                  className="rounded-lg bg-neon-primary px-3 py-2 text-xs font-bold text-white hover:bg-neon-primary-light"
                >
                  복사
                </button>
              </div>
            </div>

            <div className="flex justify-between border-t border-neon-border pt-4">
              <button
                type="button"
                onClick={() => handleDelete(selected)}
                className="rounded-lg bg-red-500/20 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-neon-border px-3 py-2 text-xs font-bold text-neon-text hover:bg-neon-bg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
