import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import type { DbVenue, VenueCategory, VenueStatus } from '@/types/database';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];
const CATEGORIES: { key: VenueCategory; label: string }[] = [
  { key: 'club', label: '클럽' },
  { key: 'night', label: '나이트' },
  { key: 'lounge', label: '라운지' },
  { key: 'room', label: '룸' },
  { key: 'yojeong', label: '요정' },
  { key: 'hoppa', label: '호빠' },
];
const STATUSES: { key: VenueStatus; label: string; color: string }[] = [
  { key: 'verified_open', label: '영업중', color: 'text-green-500' },
  { key: 'unknown', label: '확인필요', color: 'text-amber-500' },
  { key: 'closed_or_unclear', label: '폐업/불명', color: 'text-red-500' },
];
const SORT_OPTIONS = [
  { key: 'recent', label: '최근 수정' },
  { key: 'name', label: '이름순' },
  { key: 'views', label: '조회순' },
  { key: 'rating', label: '평점순' },
];

const emptyVenue: Partial<DbVenue> = {
  slug: '', name: '', name_ko: '', category: 'night',
  region: '', region_ko: '', address: '', description: '',
  short_description: '', features: [], tags: [], atmosphere: [],
  age_group: '', dress_code: '', best_time: '', parking: '',
  nearby_station: '', open_hours: '', liquor_info: '',
  booth_info: '', room_info: '', image_url: '',
  status: 'verified_open', is_premium: false, is_active: true,
  is_verified: false, staff_nickname: '', staff_phone: '', district: '',
  rating: 0, review_count: 0, view_count: 0,
};

const VENUE_PATH: Record<VenueCategory, string> = {
  club: 'clubs', night: 'nights', lounge: 'lounge',
  room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa',
};

function venueLiveUrl(v: Partial<DbVenue>): string {
  if (!v.slug || !v.region || !v.category) return '/';
  if (v.category === 'lounge') return `/${VENUE_PATH[v.category]}/${v.slug}`;
  return `/${VENUE_PATH[v.category]}/${v.region}/${v.slug}`;
}

// ── 입력 컴포넌트 ──
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-neon-text-muted">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-neon-text-muted">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm outline-none focus:border-neon-primary';

export default function VenueManagePage() {
  useDocumentMeta('업소 풀에디터 — 관리자', '120업소 전 필드 편집·일괄작업·미리보기. WP 풍 어드민.');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [venues, setVenues] = useState<DbVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DbVenue> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { if (isAdmin) loadVenues(); }, [isAdmin]);

  async function loadVenues() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('venues').select('*').order('updated_at', { ascending: false });
    if (error) setMsg({ type: 'err', text: `로드 실패: ${error.message}` });
    setVenues((data || []) as unknown as DbVenue[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!editing) return;
    const supabase = createClient();
    if (!supabase) return;
    if (!editing.slug || !editing.name_ko || !editing.category || !editing.region) {
      setMsg({ type: 'err', text: 'slug, 이름(한글), 카테고리, 지역은 필수입니다' });
      return;
    }
    setSaving(true);
    setMsg(null);

    const payload = {
      slug: editing.slug, name: editing.name || editing.name_ko,
      name_ko: editing.name_ko, category: editing.category,
      region: editing.region, region_ko: editing.region_ko || editing.region,
      address: editing.address || '', description: editing.description || '',
      short_description: editing.short_description || '',
      features: editing.features || [], tags: editing.tags || [],
      atmosphere: editing.atmosphere || [],
      age_group: editing.age_group || null, dress_code: editing.dress_code || null,
      best_time: editing.best_time || null, parking: editing.parking || null,
      nearby_station: editing.nearby_station || null, open_hours: editing.open_hours || null,
      liquor_info: editing.liquor_info || null, booth_info: editing.booth_info || null,
      room_info: editing.room_info || null, image_url: editing.image_url || null,
      status: editing.status, is_premium: !!editing.is_premium,
      is_active: editing.is_active !== false, is_verified: !!editing.is_verified,
      staff_nickname: editing.staff_nickname || null,
      staff_phone: editing.staff_phone || null,
      district: editing.district || null,
      rating: typeof editing.rating === 'number' ? editing.rating : 0,
    };

    if (isNew) {
      const { error } = await supabase.from('venues').insert(payload);
      if (error) { setMsg({ type: 'err', text: `추가 실패: ${error.message}` }); setSaving(false); return; }
      setMsg({ type: 'ok', text: '업소 추가 완료' });
    } else {
      const { error } = await supabase.from('venues').update(payload).eq('id', editing.id);
      if (error) { setMsg({ type: 'err', text: `수정 실패: ${error.message}` }); setSaving(false); return; }
      setMsg({ type: 'ok', text: '업소 수정 완료' });
    }
    setSaving(false);
    setEditing(null);
    setIsNew(false);
    loadVenues();
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('venues').delete().eq('id', id);
    if (error) { setMsg({ type: 'err', text: `삭제 실패: ${error.message}` }); return; }
    setMsg({ type: 'ok', text: '삭제 완료' });
    loadVenues();
  }

  async function bulkAction(action: 'delete' | 'premium_on' | 'premium_off' | 'verify' | 'deactivate') {
    if (selected.size === 0) return;
    const ids = [...selected];
    const labels: Record<string, string> = {
      delete: `${ids.length}개 삭제하시겠습니까?`,
      premium_on: `${ids.length}개 PRO 설정`,
      premium_off: `${ids.length}개 PRO 해제`,
      verify: `${ids.length}개 검증완료 표시`,
      deactivate: `${ids.length}개 비활성화`,
    };
    if (action === 'delete' && !confirm(labels.delete)) return;
    const supabase = createClient();
    if (!supabase) return;

    if (action === 'delete') {
      const { error } = await supabase.from('venues').delete().in('id', ids);
      if (error) { setMsg({ type: 'err', text: `일괄삭제 실패: ${error.message}` }); return; }
    } else {
      const updates: Record<string, unknown> = {};
      if (action === 'premium_on') updates.is_premium = true;
      if (action === 'premium_off') updates.is_premium = false;
      if (action === 'verify') updates.is_verified = true;
      if (action === 'deactivate') updates.is_active = false;
      const { error } = await supabase.from('venues').update(updates).in('id', ids);
      if (error) { setMsg({ type: 'err', text: `일괄변경 실패: ${error.message}` }); return; }
    }
    setMsg({ type: 'ok', text: `${labels[action]} 완료` });
    setSelected(new Set());
    loadVenues();
  }

  async function togglePremium(venue: DbVenue) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from('venues').update({ is_premium: !venue.is_premium }).eq('id', venue.id);
    if (error) { setMsg({ type: 'err', text: `변경 실패: ${error.message}` }); return; }
    loadVenues();
  }

  const filtered = useMemo(() => {
    let r = venues
      .filter(v => filterCat === 'all' || v.category === filterCat)
      .filter(v => filterStatus === 'all' || v.status === filterStatus)
      .filter(v => !search || v.name_ko.includes(search) || v.region_ko.includes(search) || v.slug.includes(search));
    if (sortBy === 'name') r = [...r].sort((a, b) => a.name_ko.localeCompare(b.name_ko, 'ko'));
    else if (sortBy === 'views') r = [...r].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    else if (sortBy === 'rating') r = [...r].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return r;
  }, [venues, filterCat, filterStatus, search, sortBy]);

  const allOnPageSelected = filtered.length > 0 && filtered.every(v => selected.has(v.id));
  function toggleAllOnPage() {
    const next = new Set(selected);
    if (allOnPageSelected) filtered.forEach(v => next.delete(v.id));
    else filtered.forEach(v => next.add(v.id));
    setSelected(next);
  }
  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" /></div>;
  if (!user || !isAdmin) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="mb-4 text-2xl font-bold text-neon-text">관리자 전용</h1>
      <p className="mb-6 text-neon-text-muted">이 페이지는 관리자만 접근 가능합니다.</p>
      <a target="_blank" rel="noopener noreferrer" href="/login" className="inline-block rounded-xl bg-neon-primary px-6 py-3 text-sm font-bold text-white">로그인</a>
    </div>
  );

  // ─────────── 편집 화면 (WP 2-column) ───────────
  if (editing) {
    const liveUrl = venueLiveUrl(editing);
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => { setEditing(null); setIsNew(false); setMsg(null); }} className="text-sm text-neon-primary hover:underline">← 목록</button>
          {!isNew && editing.slug && (
            <a target="_blank" rel="noopener noreferrer" href={liveUrl}
              className="rounded-lg border border-neon-border px-3 py-1.5 text-xs hover:bg-neon-surface-2">사이트 미리보기 ↗</a>
          )}
        </div>
        <h1 className="mb-4 text-2xl font-bold">{isNew ? '새 업소 추가' : editing.name_ko}</h1>
        {msg && <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${msg.type === 'err' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-500'}`}>{msg.text}</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── 메인 컨텐츠 ── */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-neon-border bg-neon-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neon-text-muted">기본 정보</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="가게이름 (한글 전체) *" hint="지역+종류+상호 — title 핵심">
                  <input value={editing.name_ko || ''} onChange={e => setEditing({ ...editing, name_ko: e.target.value })} className={inputCls} />
                </Field>
                <Field label="가게이름 (영문)">
                  <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
                </Field>
                <Field label="slug (URL) *" hint="예: gangnamclub-race">
                  <input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className={inputCls} />
                </Field>
                <Field label="주소">
                  <input value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} className={inputCls} />
                </Field>
                <Field label="짧은 설명 (목록·검색 노출)">
                  <input value={editing.short_description || ''} onChange={e => setEditing({ ...editing, short_description: e.target.value })} className={inputCls} />
                </Field>
                <Field label="영업시간">
                  <input value={editing.open_hours || ''} onChange={e => setEditing({ ...editing, open_hours: e.target.value })} placeholder="예: 매일 19:00–04:00" className={inputCls} />
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-neon-border bg-neon-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neon-text-muted">본문 설명</h2>
              <Field label="본문 (1000자+) — SEO 핵심" hint={`${(editing.description || '').length}자`}>
                <textarea rows={10} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className={inputCls} />
              </Field>
            </section>

            <section className="rounded-2xl border border-neon-border bg-neon-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neon-text-muted">업소 핵심 정보</h2>
              <div className="space-y-4">
                <Field label="🥃 양주 (liquor_info)">
                  <textarea rows={4} value={editing.liquor_info || ''} onChange={e => setEditing({ ...editing, liquor_info: e.target.value })} className={inputCls} />
                </Field>
                <Field label="🪑 부스 (booth_info)">
                  <textarea rows={4} value={editing.booth_info || ''} onChange={e => setEditing({ ...editing, booth_info: e.target.value })} className={inputCls} />
                </Field>
                <Field label="🚪 룸 (room_info)">
                  <textarea rows={4} value={editing.room_info || ''} onChange={e => setEditing({ ...editing, room_info: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-neon-border bg-neon-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neon-text-muted">디테일 / 분위기</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="연령대"><input value={editing.age_group || ''} onChange={e => setEditing({ ...editing, age_group: e.target.value })} className={inputCls} /></Field>
                <Field label="드레스코드"><input value={editing.dress_code || ''} onChange={e => setEditing({ ...editing, dress_code: e.target.value })} className={inputCls} /></Field>
                <Field label="베스트 타임"><input value={editing.best_time || ''} onChange={e => setEditing({ ...editing, best_time: e.target.value })} className={inputCls} /></Field>
                <Field label="주차"><input value={editing.parking || ''} onChange={e => setEditing({ ...editing, parking: e.target.value })} className={inputCls} /></Field>
                <Field label="가까운 역"><input value={editing.nearby_station || ''} onChange={e => setEditing({ ...editing, nearby_station: e.target.value })} className={inputCls} /></Field>
                <Field label="상세 위치 (district)"><input value={editing.district || ''} onChange={e => setEditing({ ...editing, district: e.target.value })} className={inputCls} /></Field>
                <div className="sm:col-span-2">
                  <Field label="분위기 (쉼표 구분)">
                    <input value={(editing.atmosphere || []).join(', ')} onChange={e => setEditing({ ...editing, atmosphere: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className={inputCls} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="특징 features (쉼표 구분)">
                    <input value={(editing.features || []).join(', ')} onChange={e => setEditing({ ...editing, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className={inputCls} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="태그 tags (쉼표 구분, SEO 키워드)">
                    <input value={(editing.tags || []).join(', ')} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className={inputCls} />
                  </Field>
                </div>
              </div>
            </section>
          </div>

          {/* ── 사이드바 (메타박스) ── */}
          <aside className="space-y-4">
            {/* 발행 박스 */}
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">발행</h3>
              <div className="space-y-3 text-sm">
                <Field label="상태">
                  <select value={editing.status || 'verified_open'} onChange={e => setEditing({ ...editing, status: e.target.value as VenueStatus })} className={inputCls}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </Field>
                <label className="flex items-center justify-between">
                  <span>활성</span>
                  <input type="checkbox" checked={editing.is_active !== false} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between">
                  <span>검증 완료</span>
                  <input type="checkbox" checked={!!editing.is_verified} onChange={e => setEditing({ ...editing, is_verified: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between">
                  <span>프리미엄 (PRO)</span>
                  <input type="checkbox" checked={!!editing.is_premium} onChange={e => setEditing({ ...editing, is_premium: e.target.checked })} />
                </label>
                {editing.updated_at && (
                  <p className="border-t border-neon-border/50 pt-2 text-[11px] text-neon-text-muted">
                    마지막 수정: {new Date(editing.updated_at).toLocaleString('ko-KR')}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-neon-primary-light disabled:opacity-60">
                    {saving ? '저장 중...' : isNew ? '추가' : '저장'}
                  </button>
                  {!isNew && editing.id && (
                    <button onClick={() => handleDelete(editing.id!)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20">삭제</button>
                  )}
                </div>
              </div>
            </div>

            {/* 카테고리/지역 */}
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">카테고리 · 지역</h3>
              <div className="space-y-3">
                <Field label="카테고리 *">
                  <select value={editing.category || 'night'} onChange={e => setEditing({ ...editing, category: e.target.value as VenueCategory })} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="지역 코드 (region) *" hint="예: gangnam, ilsan, busan-haeundae">
                  <input value={editing.region || ''} onChange={e => setEditing({ ...editing, region: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className={inputCls} />
                </Field>
                <Field label="지역 한글">
                  <input value={editing.region_ko || ''} onChange={e => setEditing({ ...editing, region_ko: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* 대표 이미지 */}
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">대표 이미지</h3>
              <Field label="image_url" hint="비워두면 그라디언트+이모지 fallback">
                <input value={editing.image_url || ''} onChange={e => setEditing({ ...editing, image_url: e.target.value })} className={inputCls} />
              </Field>
              {editing.slug && (
                <div className="mt-3 overflow-hidden rounded-lg border border-neon-border" style={{ aspectRatio: '1/1' }}>
                  <img src={editing.image_url || `/venues/${editing.slug}-1.webp`} alt="" className="h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* 담당자 */}
            <div className="rounded-2xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">담당자</h3>
              <div className="space-y-3">
                <Field label="닉네임"><input value={editing.staff_nickname || ''} onChange={e => setEditing({ ...editing, staff_nickname: e.target.value })} className={inputCls} /></Field>
                <Field label="전화번호"><input value={editing.staff_phone || ''} onChange={e => setEditing({ ...editing, staff_phone: e.target.value })} placeholder="010-0000-0000" className={inputCls} /></Field>
              </div>
            </div>

            {/* 통계 */}
            {!isNew && (
              <div className="rounded-2xl border border-neon-border bg-neon-surface p-4 text-sm">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neon-text-muted">통계 (read-only)</h3>
                <div className="space-y-1.5 text-neon-text-muted">
                  <div className="flex justify-between"><span>조회수</span><span className="font-mono text-neon-text">{editing.view_count || 0}</span></div>
                  <div className="flex justify-between"><span>리뷰</span><span className="font-mono text-neon-text">{editing.review_count || 0}</span></div>
                  <div className="flex justify-between items-center gap-2">
                    <span>평점</span>
                    <input type="number" step="0.1" min="0" max="5" value={editing.rating || 0}
                      onChange={e => setEditing({ ...editing, rating: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded border border-neon-border bg-neon-bg px-2 py-1 text-right text-xs font-mono" />
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // ─────────── 목록 ───────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업소 풀에디터</h1>
          <p className="mt-1 text-sm text-neon-text-muted">
            총 {venues.length}개 · 필터 {filtered.length}개
            {selected.size > 0 && <span className="ml-2 text-neon-primary">({selected.size}개 선택)</span>}
          </p>
        </div>
        <button onClick={() => { setEditing({ ...emptyVenue }); setIsNew(true); setMsg(null); }}
          className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-primary-light">
          + 새 업소
        </button>
      </div>

      {msg && <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${msg.type === 'err' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-500'}`}>{msg.text}</p>}

      {/* 필터/검색/정렬 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm">
          <option value="all">전체 카테고리</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm">
          <option value="all">전체 상태</option>
          {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm">
          {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름·지역·slug 검색"
          className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm focus:border-neon-primary" />
      </div>

      {/* 일괄 작업 toolbar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-neon-primary/30 bg-neon-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size}개 선택:</span>
          <button onClick={() => bulkAction('premium_on')} className="rounded-lg bg-neon-gold/20 px-3 py-1 text-xs text-neon-gold hover:bg-neon-gold/30">PRO 설정</button>
          <button onClick={() => bulkAction('premium_off')} className="rounded-lg bg-neon-surface-2 px-3 py-1 text-xs hover:bg-neon-bg">PRO 해제</button>
          <button onClick={() => bulkAction('verify')} className="rounded-lg bg-green-500/15 px-3 py-1 text-xs text-green-500 hover:bg-green-500/25">검증완료</button>
          <button onClick={() => bulkAction('deactivate')} className="rounded-lg bg-amber-500/15 px-3 py-1 text-xs text-amber-500 hover:bg-amber-500/25">비활성화</button>
          <button onClick={() => bulkAction('delete')} className="rounded-lg bg-red-500/15 px-3 py-1 text-xs text-red-400 hover:bg-red-500/25">일괄 삭제</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-neon-text-muted hover:underline">선택 해제</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neon-border bg-neon-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-border text-neon-text-muted">
                <th className="w-10 px-3 py-3"><input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} /></th>
                <th className="px-3 py-3 text-left font-medium">가게이름</th>
                <th className="px-3 py-3 text-left font-medium">카테고리</th>
                <th className="px-3 py-3 text-left font-medium">지역</th>
                <th className="px-3 py-3 text-left font-medium">상태</th>
                <th className="px-3 py-3 text-center font-medium">PRO</th>
                <th className="px-3 py-3 text-right font-medium">조회</th>
                <th className="px-3 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const stat = STATUSES.find(s => s.key === v.status);
                return (
                  <tr key={v.id} className="border-b border-neon-border/50 last:border-0 hover:bg-neon-bg/50">
                    <td className="px-3 py-3"><input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleOne(v.id)} /></td>
                    <td className="px-3 py-3">
                      <button onClick={() => { setEditing({ ...v }); setIsNew(false); setMsg(null); }} className="font-medium text-left hover:text-neon-primary">
                        {v.name_ko}
                      </button>
                      <p className="text-[11px] text-neon-text-muted font-mono">{v.slug}</p>
                    </td>
                    <td className="px-3 py-3">{CATEGORIES.find(c => c.key === v.category)?.label || v.category}</td>
                    <td className="px-3 py-3">{v.region_ko}</td>
                    <td className={`px-3 py-3 text-xs ${stat?.color || ''}`}>{stat?.label || v.status}</td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => togglePremium(v)}
                        className={`rounded-full px-3 py-0.5 text-xs font-medium ${v.is_premium ? 'bg-neon-gold/20 text-neon-gold' : 'bg-neon-surface-2 text-neon-text-muted'}`}>
                        {v.is_premium ? 'PRO' : '-'}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-neon-text-muted">{v.view_count || 0}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <a target="_blank" rel="noopener noreferrer" href={venueLiveUrl(v)}
                          className="rounded bg-neon-surface-2 px-2 py-1 text-xs hover:bg-neon-bg" title="사이트에서 보기">↗</a>
                        <button onClick={() => { setEditing({ ...v }); setIsNew(false); setMsg(null); }}
                          className="rounded bg-neon-primary/10 px-2 py-1 text-xs text-neon-primary-light hover:bg-neon-primary/20">수정</button>
                        <button onClick={() => handleDelete(v.id)}
                          className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20">삭제</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-neon-text-muted">
                  {venues.length === 0 ? 'Supabase에 업소 데이터가 없습니다 (full_venues_setup.sql 시드 필요)' : '검색 결과가 없습니다'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
