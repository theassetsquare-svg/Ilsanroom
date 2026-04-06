/**
 * Supabase 테이블 생성 스크립트
 * 실행: node scripts/create-tables.mjs
 */

const SUPABASE_URL = 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hjLH8puvrYsVNPt38KROkQ_v99vtC3c';

const tables = [
  // posts 테이블
  `CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    venue_slug TEXT,
    rating INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  // comments 테이블
  `CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    parent_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  // users 프로필
  `CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nickname TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  // RLS
  `ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`,
];

const policies = [
  // posts
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'posts_select') THEN CREATE POLICY posts_select ON public.posts FOR SELECT USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'posts_insert') THEN CREATE POLICY posts_insert ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'posts_update') THEN CREATE POLICY posts_update ON public.posts FOR UPDATE USING (auth.uid() = user_id); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'posts_delete') THEN CREATE POLICY posts_delete ON public.posts FOR DELETE USING (auth.uid() = user_id); END IF; END $$`,
  // comments
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comments_select') THEN CREATE POLICY comments_select ON public.comments FOR SELECT USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comments_insert') THEN CREATE POLICY comments_insert ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'comments_delete') THEN CREATE POLICY comments_delete ON public.comments FOR DELETE USING (auth.uid() = user_id); END IF; END $$`,
  // users
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_select') THEN CREATE POLICY users_select ON public.users FOR SELECT USING (true); END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_upsert') THEN CREATE POLICY users_upsert ON public.users FOR INSERT WITH CHECK (auth.uid() = id); END IF; END $$`,
];

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  return res;
}

async function main() {
  console.log('=== Supabase 테이블 생성 ===\n');

  for (const sql of [...tables, ...policies]) {
    const label = sql.slice(0, 60).replace(/\n/g, ' ');
    const res = await runSQL(sql);
    if (res.ok) {
      console.log(`✅ ${label}...`);
    } else {
      const text = await res.text();
      console.log(`⚠️  ${label}... → ${res.status} (RPC 불가 — SQL Editor에서 실행 필요)`);
    }
  }

  console.log('\n=== 완료 ===');
  console.log('\nRPC가 안 되면 Supabase Dashboard > SQL Editor에서 아래 SQL을 직접 실행하세요:\n');
  console.log([...tables, ...policies.map(p => p.replace(/DO \$\$ BEGIN IF NOT EXISTS.*THEN /,'').replace(/; END IF; END \$\$/,''))].join(';\n\n'));
}

main();
