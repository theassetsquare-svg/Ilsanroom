/**
 * 매거진 예약발행 promote
 * - magazine_articles 에서 scheduled_for <= now() AND is_published = false 항목을
 *   is_published = true 로 변경 (사람이 미리 써둔 글의 자동 시간대 공개)
 * - AI 자동 본문 생성 X. 사람이 /admin/magazine 에서 작성한 글만.
 *
 * 환경변수:
 *   VITE_SUPABASE_URL — Supabase URL
 *   SUPABASE_SERVICE_KEY — service_role 키 (RLS 우회)
 *
 * 실행: node scripts/magazine/promote-scheduled.mjs
 */

import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!URL || !KEY) {
  console.log('⚠️  SUPABASE 환경변수 미설정 — promote skip');
  process.exit(0);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const nowIso = new Date().toISOString();

const { data: due, error: selectErr } = await supabase
  .from('magazine_articles')
  .select('id, title, scheduled_for')
  .eq('is_published', false)
  .not('scheduled_for', 'is', null)
  .lte('scheduled_for', nowIso);

if (selectErr) {
  console.error('❌ select failed:', selectErr.message);
  process.exit(1);
}

if (!due || due.length === 0) {
  console.log('✓ 발행 예정 매거진 0건');
  process.exit(0);
}

const ids = due.map(d => d.id);
const { error: updateErr } = await supabase
  .from('magazine_articles')
  .update({ is_published: true })
  .in('id', ids);

if (updateErr) {
  console.error('❌ update failed:', updateErr.message);
  process.exit(1);
}

console.log(`✅ ${due.length}건 발행:`);
due.forEach(d => console.log(`   - [${d.scheduled_for}] ${d.title}`));
