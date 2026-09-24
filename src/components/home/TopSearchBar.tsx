import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/lib/visitor-tracker';

/**
 * [놀쿨11-4] 홈 상단 검색창(네이버형 홈) — 가게이름·지역·업종 자동완성.
 *  - 색인은 로컬(가게 장부 `@/data/venues`)뿐 · 외부 호출 0 · 첫 입력 때만 동적 import(홈 첫 화면 번들에 462KB 장부를 싣지 않는다).
 *  - 제출 → /search?q= (있는 검색 쪽) · GA4 search_use(게이트 뒤).
 *  - 프리렌더 홈에도 같은 form(action=/search/ · datalist)이 있어 JS 없이도 검색된다.
 */
type Idx = { names: string[]; regions: string[]; cats: string[] };
let IDX: Idx | null = null;
async function loadIdx(): Promise<Idx> {
  if (IDX) return IDX;
  const mod = await import('@/data/venues');
  const open = mod.venues.filter((v) => v.status !== 'closed_or_unclear');
  const names = [...new Set(open.map((v) => v.nameKo))];
  const regions = [...new Set(open.map((v) => v.regionKo).filter(Boolean))];
  const cats = ['클럽', '나이트', '라운지', '룸', '요정', '호빠'];
  IDX = { names, regions, cats };
  return IDX;
}
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
function suggest(idx: Idx, q: string): string[] {
  const n = norm(q); if (!n) return [];
  const out: string[] = []; const seen = new Set<string>();
  const add = (s: string) => { if (!seen.has(s) && out.length < 8) { seen.add(s); out.push(s); } };
  for (const x of idx.names) if (norm(x).startsWith(n)) add(x);
  for (const x of idx.names) if (norm(x).includes(n)) add(x);
  for (const r of idx.regions) if (norm(r).includes(n) || n.includes(norm(r))) { add(r); for (const c of idx.cats) add(`${r} ${c}`); }
  for (const c of idx.cats) if (norm(c).includes(n)) add(c);
  return out.slice(0, 8);
}

export default function TopSearchBar() {
  const [q, setQ] = useState('');
  const [sugg, setSugg] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    if (!q.trim()) { setSugg([]); return; }
    loadIdx().then((idx) => { if (alive) setSugg(suggest(idx, q)); });
    return () => { alive = false; };
  }, [q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const go = (term: string) => {
    const t = term.trim(); if (!t) return;
    trackEvent('search_use', { search_term: t, from: 'home_top' });
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(t)}`);
  };

  return (
    <div ref={wrap} className="relative mb-3" data-nc-top-search>
      <form role="search" action="/search" method="get" onSubmit={(e) => { e.preventDefault(); go(q); }} className="flex gap-2">
        <input
          name="q" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => { setOpen(true); loadIdx(); }}
          placeholder="가게이름 · 지역 · 업종" aria-label="검색어" autoComplete="off" inputMode="search"
          className="flex-1 min-w-0 rounded-xl border-2 border-white/80 bg-white px-4 py-3 text-[16px] text-[#111] outline-none focus:border-pink-400"
        />
        <button type="submit" className="rounded-xl bg-pink-500 px-4 py-3 text-[15px] font-bold text-white active:bg-pink-600">검색</button>
      </form>
      {open && sugg.length > 0 && (
        <ul role="listbox" aria-label="자동완성" className="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg" data-nc-suggest>
          {sugg.map((s) => (
            <li key={s} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(s); go(s); }} className="block w-full px-4 py-2.5 text-left text-[15px] text-[#111] hover:bg-gray-50">{s}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
