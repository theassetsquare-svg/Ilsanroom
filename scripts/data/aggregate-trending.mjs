/**
 * Trending Today 집계
 * - 최근 24시간 page_events 의 'view' 이벤트를 path 기준 집계
 * - venues 테이블 slug 매칭해서 venue 페이지만 추출 (홈/리스트/커뮤니티 제외)
 * - public/data/trending-today.json 작성
 *
 * 가짜 데이터 0. page_events 가 비어있으면 빈 배열로 저장 → 위젯 자동 숨김.
 *
 * 환경변수:
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * 실행: node scripts/data/aggregate-trending.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

const OUTPUT = resolve('public/data/trending-today.json');
const WINDOW_HOURS = 24;
const TOP_N = 15;

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!URL || !KEY) {
  console.log('⚠️  SUPABASE 환경변수 미설정 — 빈 JSON 작성 (위젯 숨김)');
  writeJson({ generated_at: null, window_hours: WINDOW_HOURS, items: [] });
  process.exit(0);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString();

// 1) page_events: view 이벤트만, 24시간 윈도우
const { data: events, error: evErr } = await supabase
  .from('page_events')
  .select('path')
  .eq('event_type', 'view')
  .gte('created_at', since)
  .limit(50000);

if (evErr) {
  console.error('❌ page_events select failed:', evErr.message);
  writeJson({ generated_at: new Date().toISOString(), window_hours: WINDOW_HOURS, items: [] });
  process.exit(0);
}

if (!events || events.length === 0) {
  console.log('✓ page_events 0건 — 빈 JSON');
  writeJson({ generated_at: new Date().toISOString(), window_hours: WINDOW_HOURS, items: [] });
  process.exit(0);
}

// 2) venues 메타 (slug → {name, category, region})
const { data: venues, error: vErr } = await supabase
  .from('venues')
  .select('slug, name_ko, name, category, region_ko, region, is_active')
  .eq('is_active', true);

if (vErr || !venues) {
  console.error('❌ venues select failed:', vErr?.message);
  writeJson({ generated_at: new Date().toISOString(), window_hours: WINDOW_HOURS, items: [] });
  process.exit(0);
}

const venueBySlug = new Map();
for (const v of venues) {
  venueBySlug.set(v.slug, {
    title: v.name_ko || v.name,
    category: v.category,
    region: v.region_ko || v.region,
  });
}

// 3) path → count 집계, venue 페이지만 (slug 매칭)
const counts = new Map();
for (const ev of events) {
  const path = (ev.path || '').replace(/[?#].*$/, '').replace(/\/+$/, '');
  if (!path) continue;
  // 마지막 세그먼트를 slug 후보로
  const segs = path.split('/').filter(Boolean);
  if (segs.length < 2) continue;
  const slug = segs[segs.length - 1];
  if (!venueBySlug.has(slug)) continue;
  counts.set(path, (counts.get(path) || 0) + 1);
}

const items = [...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, TOP_N)
  .map(([path, views]) => {
    const slug = path.split('/').filter(Boolean).pop();
    const meta = venueBySlug.get(slug);
    return {
      path,
      title: meta.title,
      category: meta.category,
      region: meta.region,
      views_24h: views,
    };
  });

writeJson({
  generated_at: new Date().toISOString(),
  window_hours: WINDOW_HOURS,
  items,
});

console.log(`✅ trending-today.json: ${items.length} venues (events: ${events.length})`);

function writeJson(obj) {
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(obj, null, 2));
}
