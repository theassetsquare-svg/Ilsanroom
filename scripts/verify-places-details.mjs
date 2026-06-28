#!/usr/bin/env node
/**
 * 읽기전용 Places 검증 — venues.ts 를 절대 쓰지 않는다(보고만).
 * 이미 검증된 place_id(places-provenance.json)로 Place Details(공식 주소·좌표)와
 * 가장 가까운 지하철역(searchNearby)을 다시 조회해, 본문 위치 정합용 ground-truth 를
 * Actions 로그에 출력한다. ★별점/리뷰는 fields에서 제외. 쓰기·커밋 0.
 *
 * 대상 slug 는 인자로 받는다(공백 구분). 없으면 종료.
 */
import { readFileSync } from 'node:fs';

const KEY = process.env.GOOGLE_PLACES_API_KEY || '';
if (!KEY) { console.log('⏭️  GOOGLE_PLACES_API_KEY 미설정 — 종료'); process.exit(0); }

const PROV = 'src/data/places-provenance.json';
const prov = JSON.parse(readFileSync(PROV, 'utf8'));
const slugs = process.argv.slice(2);
if (!slugs.length) { console.log('대상 slug 없음'); process.exit(0); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function details(placeId) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,shortFormattedAddress,addressComponents,location,primaryType,types',
      'Accept-Language': 'ko',
    },
  }).then((x) => x.json());
  return r;
}

async function nearestStation(lat, lng) {
  const r = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.displayName,places.location',
    },
    body: JSON.stringify({
      includedTypes: ['subway_station', 'train_station', 'transit_station'],
      maxResultCount: 5,
      rankPreference: 'DISTANCE',
      languageCode: 'ko',
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 2000 } },
    }),
  }).then((x) => x.json());
  return (r.places || []).map((p) => p.displayName?.text).filter(Boolean);
}

function dongFromComponents(comps) {
  if (!Array.isArray(comps)) return '';
  // sublocality_level_2/4 = 동, sublocality_level_1 = 구
  const find = (t) => comps.find((c) => (c.types || []).includes(t))?.longText || '';
  const dong = find('sublocality_level_2') || find('sublocality_level_4') || find('sublocality_level_3') || '';
  const gu = find('sublocality_level_1') || find('administrative_area_level_2') || '';
  return `${gu} ${dong}`.trim();
}

for (const slug of slugs) {
  const p = prov[slug];
  console.log(`\n===== ${slug} =====`);
  if (!p || !p.place_id) { console.log('  ❌ place_id 없음'); continue; }
  console.log(`  matchedName(기록): ${p.matchedName}`);
  console.log(`  place_id: ${p.place_id}`);
  const d = await details(p.place_id);
  if (d.error) { console.log(`  ❌ details error: ${d.error.status || JSON.stringify(d.error)}`); await sleep(150); continue; }
  console.log(`  현재이름: ${d.displayName?.text || ''}`);
  console.log(`  ★공식주소: ${d.formattedAddress || ''}`);
  console.log(`  구·동(components): ${dongFromComponents(d.addressComponents)}`);
  console.log(`  primaryType: ${d.primaryType} | types: ${(d.types || []).join(',')}`);
  if (d.location) {
    console.log(`  좌표: ${d.location.latitude}, ${d.location.longitude}`);
    const st = await nearestStation(d.location.latitude, d.location.longitude);
    console.log(`  ★가까운역(거리순): ${st.join(' < ') || '(없음)'}`);
    await sleep(150);
  }
  await sleep(150);
}
console.log('\n✅ 읽기전용 검증 완료(venues.ts 변경 0)');
