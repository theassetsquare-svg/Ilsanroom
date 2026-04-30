/**
 * seed-venues.mjs
 * 기존 src/data/venues.ts → Supabase INSERT SQL 변환
 *
 * 사용법:
 *   node scripts/seed-venues.mjs > supabase/migrations/002_seed_venues.sql
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const venuesPath = resolve(__dirname, '../src/data/venues.ts');
const raw = readFileSync(venuesPath, 'utf-8');

// venues 배열 부분만 추출
const arrStart = raw.indexOf('export const venues: Venue[] = [');
if (arrStart === -1) {
  console.error('venues 배열을 찾을 수 없습니다.');
  process.exit(1);
}

let arrBody = raw.slice(arrStart);
arrBody = arrBody.replace(/^export const venues: Venue\[\] = /, '');
arrBody = arrBody.replace(/;\s*$/, '');

// TS 문법 제거
arrBody = arrBody.replace(/\s+as\s+(?:VenueCategory|const|'[^']*')/g, '');
// import 타입 참조 제거
arrBody = arrBody.replace(/:\s*VenueCategory/g, '');

// Function 생성자로 안전하게 평가 (모듈 스코프 밖)
const venues = new Function(`return ${arrBody}`)();

console.error(`${venues.length}개 가게 파싱 성공`);

function esc(str) {
  if (str === null || str === undefined || str === '') return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function escArr(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'";
  const items = arr.map(s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',');
  return "'{" + items + "}'";
}

console.log('-- ===========================================');
console.log('-- 놀쿨 venues 시드 데이터');
console.log(`-- 총 ${venues.length}개 가게`);
console.log(`-- 생성일: ${new Date().toISOString().slice(0, 10)}`);
console.log('-- ===========================================');
console.log('');
console.log('INSERT INTO venues (slug, name, name_ko, category, region, region_ko, address, description, short_description, features, atmosphere, age_group, dress_code, best_time, parking, nearby_station, image_url, rating, review_count, is_premium, is_verified, status, open_hours, tags, liquor_info, booth_info, room_info, staff_nickname, staff_phone, district, is_active, view_count) VALUES');

const rows = venues.map((v, i) => {
  const vals = [
    esc(v.slug),
    esc(v.name),
    esc(v.nameKo || v.name),
    esc(v.category),
    esc(v.region),
    esc(v.regionKo || v.region),
    esc(v.address),
    esc(v.description),
    esc(v.shortDescription),
    escArr(v.features),
    escArr(v.atmosphere),
    esc(v.ageGroup),
    esc(v.dressCode),
    esc(v.bestTime),
    esc(v.parking),
    esc(v.nearbyStation),
    esc(v.imageUrl),
    v.rating || 0,
    v.reviewCount || 0,
    v.isPremium ? 'true' : 'false',
    v.isVerified ? 'true' : 'false',
    esc(v.status || 'verified_open'),
    esc(v.openHours),
    escArr(v.tags),
    esc(v.liquorInfo),
    esc(v.boothInfo),
    esc(v.roomInfo),
    esc(v.staffNickname),
    esc(v.staffPhone),
    esc(v.district),
    'true',
    v.viewCount || 0,
  ].join(', ');
  const comma = i < venues.length - 1 ? ',' : ';';
  return `(${vals})${comma}`;
});

rows.forEach(r => console.log(r));

console.log('');
console.log(`-- ${venues.length}개 가게 시드 완료`);
