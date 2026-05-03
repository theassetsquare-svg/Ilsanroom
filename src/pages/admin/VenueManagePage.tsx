import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import type { DbVenue, VenueCategory } from '@/types/database';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com'];
const CATEGORIES: { key: VenueCategory; label: string }[] = [
  { key: 'club', label: '클럽' },
  { key: 'night', label: '나이트' },
  { key: 'lounge', label: '라운지' },
  { key: 'room', label: '룸' },
  { key: 'yojeong', label: '요정' },
  { key: 'hoppa', label: '호빠' },
];

const emptyVenue: Partial<DbVenue> = {
  slug: '', name: '', name_ko: '', category: 'night',
  region: '', region_ko: '', address: '', description: '',
  short_description: '', features: [], tags: [],
  status: 'verified_open', is_premium: false, is_active: true,
  staff_nickname: '', staff_phone: '', district: '',
};

export default function VenueManagePage() {
  useDocumentMeta('매장 수정·삭제 — 관리자 전용', '관리자 전용 페이지. 업소 정보 수정·사진 교체·영업 상태 토글·리뷰 신고 처리·광고 노출 영역 변경 모두 가능.');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const [venues, setVenues] = useState<DbVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DbVenue> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    loadVenues();
  }, [isAdmin]);

  async function loadVenues() {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false });
    setVenues((data || []) as unknown as DbVenue[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!editing) return;
    const supabase = createClient();
    if (!supabase) return;
    setSaving(true);
    setMsg('');

    const payload: Record<string, unknown> = {
      slug: editing.slug, name: editing.name, name_ko: editing.name_ko,
      category: editing.category, region: editing.region, region_ko: editing.region_ko,
      address: editing.address || '', description: editing.description,
      short_description: editing.short_description,
      features: editing.features || [], tags: editing.tags || [],
      status: editing.status, is_premium: editing.is_premium,
      is_active: editing.is_active, staff_nickname: editing.staff_nickname || null,
      staff_phone: editing.staff_phone || null, district: editing.district || null,
      image_url: editing.image_url || null,
    };

    if (isNew) {
      const { error } = await supabase.from('venues').insert(payload);
      if (error) { setMsg(`오류: ${error.message}`); setSaving(false); return; }
      setMsg('업소 추가 완료');
    } else {
      const { error } = await supabase.from('venues').update(payload).eq('id', editing.id);
      if (error) { setMsg(`오류: ${error.message}`); setSaving(false); return; }
      setMsg('업소 수정 완료');
    }
    setSaving(false);
    setEditing(null);
    setIsNew(false);
    loadVenues();
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('venues').delete().eq('id', id);
    setMsg('삭제 완료');
    loadVenues();
  }

  async function togglePremium(venue: DbVenue) {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('venues').update({ is_premium: !venue.is_premium }).eq('id', venue.id);
    loadVenues();
  }

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" /></div>;
  if (!user || !isAdmin) return <div className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="text-2xl font-bold text-neon-text mb-4">관리자 전용</h1><p className="text-neon-text-muted mb-6">이 페이지는 관리자만 접근 가능합니다.</p><a target="_blank" rel="noopener noreferrer" href="/login" className="inline-block rounded-xl bg-neon-primary px-6 py-3 text-sm font-bold text-white">로그인</a></div>;

  const filtered = venues
    .filter(v => filterCat === 'all' || v.category === filterCat)
    .filter(v => !search || v.name_ko.includes(search) || v.region_ko.includes(search));

  // ─── 편집 폼 ───
  if (editing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => { setEditing(null); setIsNew(false); }} className="mb-4 text-sm text-neon-primary hover:underline">← 목록으로</button>
        <h1 className="text-2xl font-bold mb-6">{isNew ? '업소 추가' : '업소 수정'}</h1>
        {msg && <p className={`mb-4 text-sm ${msg.startsWith('오류') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}

        <div className="space-y-4 rounded-2xl border border-neon-border bg-neon-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">slug (URL)</label>
              <input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })}
                className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">카테고리</label>
              <select value={editing.category || 'night'} onChange={e => setEditing({ ...editing, category: e.target.value as VenueCategory })}
                className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary">
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">가게이름 (영문)</label>
              <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">가게이름 (한글 전체)</label>
              <input value={editing.name_ko || ''} onChange={e => setEditing({ ...editing, name_ko: e.target.value })}
                placeholder="지역+종류+상호명" className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">지역 (영문)</label>
              <input value={editing.region || ''} onChange={e => setEditing({ ...editing, region: e.target.value })}
                className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">지역 (한글)</label>
              <input value={editing.region_ko || ''} onChange={e => setEditing({ ...editing, region_ko: e.target.value })}
                className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">상세 위치</label>
              <input value={editing.district || ''} onChange={e => setEditing({ ...editing, district: e.target.value })}
                className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neon-text-muted mb-1">본문 설명 (1000자+)</label>
            <textarea rows={8} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            <p className="text-xs text-neon-text-muted mt-1">{(editing.description || '').length}자</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neon-text-muted mb-1">짧은 설명</label>
            <input value={editing.short_description || ''} onChange={e => setEditing({ ...editing, short_description: e.target.value })}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">담당 닉네임</label>
              <input value={editing.staff_nickname || ''} onChange={e => setEditing({ ...editing, staff_nickname: e.target.value })}
                className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neon-text-muted mb-1">담당 전화번호</label>
              <input value={editing.staff_phone || ''} onChange={e => setEditing({ ...editing, staff_phone: e.target.value })}
                placeholder="010-0000-0000" className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neon-text-muted mb-1">이미지 URL</label>
            <input value={editing.image_url || ''} onChange={e => setEditing({ ...editing, image_url: e.target.value })}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neon-text-muted mb-1">태그 (쉼표 구분)</label>
            <input value={(editing.tags || []).join(', ')} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_premium || false} onChange={e => setEditing({ ...editing, is_premium: e.target.checked })} />
              프리미엄
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active !== false} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
              활성
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="rounded-xl bg-neon-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-neon-primary-light disabled:opacity-60">
              {saving ? '저장 중...' : isNew ? '추가' : '수정'}
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); }}
              className="rounded-xl border border-neon-border px-6 py-2.5 text-sm transition hover:bg-neon-surface-2">
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 목록 ───
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">업소 관리</h1>
          <p className="text-sm text-neon-text-muted mt-1">총 {venues.length}개 업소</p>
        </div>
        <button onClick={() => { setEditing({ ...emptyVenue }); setIsNew(true); setMsg(''); }}
          className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-primary-light">
          + 업소 추가
        </button>
      </div>

      {msg && <p className={`mb-4 text-sm ${msg.startsWith('오류') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none">
          <option value="all">전체 카테고리</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름/지역 검색"
          className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neon-border bg-neon-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-border text-neon-text-muted">
                <th className="px-4 py-3 text-left font-medium">가게이름</th>
                <th className="px-4 py-3 text-left font-medium">카테고리</th>
                <th className="px-4 py-3 text-left font-medium">지역</th>
                <th className="px-4 py-3 text-left font-medium">담당</th>
                <th className="px-4 py-3 text-center font-medium">프리미엄</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b border-neon-border/50 last:border-0 hover:bg-neon-bg/50">
                  <td className="px-4 py-3 font-medium">{v.name_ko}</td>
                  <td className="px-4 py-3">{CATEGORIES.find(c => c.key === v.category)?.label || v.category}</td>
                  <td className="px-4 py-3">{v.region_ko}</td>
                  <td className="px-4 py-3 text-neon-text-muted">{v.staff_nickname || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => togglePremium(v)}
                      className={`rounded-full px-3 py-0.5 text-xs font-medium ${v.is_premium ? 'bg-neon-gold/20 text-neon-gold' : 'bg-neon-surface-2 text-neon-text-muted'}`}>
                      {v.is_premium ? 'PRO' : '-'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditing({ ...v }); setIsNew(false); setMsg(''); }}
                        className="rounded-lg bg-neon-primary/10 px-3 py-1 text-xs text-neon-primary-light hover:bg-neon-primary/20">수정</button>
                      <button onClick={() => handleDelete(v.id)}
                        className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neon-text-muted">
                  {venues.length === 0 ? 'Supabase에 업소 데이터가 없습니다' : '검색 결과가 없습니다'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
