/**
 * Supabase Seed Script — venues.ts 데이터를 Supabase에 upsert
 *
 * 실행: npx tsx scripts/seed-supabase.ts
 *
 * venues.ts를 직접 import해서 동기화. 데이터 중복 관리 불필요.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { venues } from '../src/data/venues';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log(`\n🌱 Seeding ${venues.length} venues to Supabase...\n`);

  const BATCH_SIZE = 10;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < venues.length; i += BATCH_SIZE) {
    const batch = venues.slice(i, i + BATCH_SIZE).map((v) => ({
      slug: v.slug,
      name: v.name,
      name_ko: v.nameKo,
      category: v.category,
      region: v.region,
      region_ko: v.regionKo,
      address: v.address || '',
      description: v.description,
      short_description: v.shortDescription,
      features: v.features,
      atmosphere: v.atmosphere,
      age_group: v.ageGroup || null,
      dress_code: v.dressCode || null,
      best_time: v.bestTime || null,
      parking: v.parking || null,
      nearby_station: v.nearbyStation || null,
      image_url: v.imageUrl || null,
      rating: v.rating,
      review_count: v.reviewCount,
      is_premium: v.isPremium,
      is_verified: v.isVerified,
      status: v.status,
      open_hours: v.openHours || null,
      tags: v.tags,
      staff_nickname: v.staffNickname || null,
      staff_phone: v.staffPhone || null,
      district: v.district || null,
      is_active: true,
    }));

    const { error } = await supabase
      .from('venues')
      .upsert(batch, { onConflict: 'slug' });

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} venues upserted`);
      success += batch.length;
    }
  }

  console.log(`\n📊 Results: ${success} success, ${failed} failed, ${venues.length} total\n`);
}

seed().catch(console.error);
