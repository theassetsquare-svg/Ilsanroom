/**
 * Recently Updated 집계
 * - venues 테이블 updated_at desc 정렬 후 상위 N건
 * - 광고주가 /admin/venues 에서 실제 변경한 venue만 (자동 updated_at 터치 X — 트러스트 룰)
 * - public/data/recently-updated.json 작성
 *
 * 환경변수:
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * 실행: node scripts/data/aggregate-recently-updated.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

const OUTPUT = resolve('public/data/recently-updated.json');
const TOP_N = 12;
// 30일 이전에 업데이트된 venue는 "최근 업데이트"가 아니므로 제외
const FRESH_WINDOW_DAYS = 30;

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!URL || !KEY) {
  console.log('⚠️  SUPABASE 환경변수 미설정 — 빈 JSON');
  writeJson({ generated_at: null, items: [] });
  process.exit(0);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const since = new Date(Date.now() - FRESH_WINDOW_DAYS * 86400 * 1000).toISOString();

const { data: venues, error } = await supabase
  .from('venues')
  .select('slug, name_ko, name, category, region_ko, region, updated_at, is_active')
  .eq('is_active', true)
  .gte('updated_at', since)
  .order('updated_at', { ascending: false })
  .limit(TOP_N);

if (error) {
  console.error('❌ venues select failed:', error.message);
  writeJson({ generated_at: new Date().toISOString(), items: [] });
  process.exit(0);
}

// HomePage getCategoryHref와 동일 패턴 — region 포함되는 카테고리 구분
function venueHref(category, slug, region) {
  switch (category) {
    case 'club':    return `/clubs/${region}/${slug}`;
    case 'night':   return `/nights/${slug}`;
    case 'lounge':  return `/lounges/${slug}`;
    case 'room':    return `/rooms/${region}/${slug}`;
    case 'yojeong': return `/yojeong/${region}/${slug}`;
    case 'hoppa':   return `/hoppa/${slug}`;
    default:        return `/${category}/${slug}`;
  }
}

const items = (venues || []).map(v => ({
  path: venueHref(v.category, v.slug, v.region),
  title: v.name_ko || v.name,
  category: v.category,
  region: v.region_ko || v.region,
  updated_at: v.updated_at,
}));

writeJson({
  generated_at: new Date().toISOString(),
  items,
});

console.log(`✅ recently-updated.json: ${items.length} venues`);

function writeJson(obj) {
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(obj, null, 2));
}
