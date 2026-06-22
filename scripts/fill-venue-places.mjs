#!/usr/bin/env node
/**
 * [Task2] venue 빈 address/openHours/nearbyStation 을 Google Places로만 채운다.
 *
 * 정직 불변식: 주소·영업시간은 절대 지어내지 않는다. Places에서 "이름이 확실히 일치하는"
 *   1건을 찾았을 때만 채우고(불확실=SKIP), 별점·리뷰는 절대 가져오지 않는다(fields에서 제외).
 *   채운 값은 src/data/places-provenance.json 에 place_id와 함께 출처를 남기고,
 *   places-source-gate.mjs 가 "출처 없는 주소/시간" 재유입을 빌드에서 영구 차단한다.
 *
 * 모드:
 *   --seed-manual : API 없이, 현재 비어있지 않은 필드를 source:'manual'(기존입력)로 provenance 기록만.
 *   --mock        : API 없이, 빈 필드에 MOCK 값 채움(쓰기 로직 검증용. 커밋 금지).
 *   (기본)        : GOOGLE_PLACES_API_KEY 로 실제 Places 조회 후 빈 필드만 채움.
 *   --limit N     : 처리 venue 수 제한(테스트용).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const VENUES = 'src/data/venues.ts';
const PROV = 'src/data/places-provenance.json';
const KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const args = process.argv.slice(2);
const MODE_SEED = args.includes('--seed-manual');
const MODE_MOCK = args.includes('--mock');
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity; })();
const FIELDS = ['address', 'openHours', 'nearbyStation'];

const text0 = readFileSync(VENUES, 'utf8');

// venue 블록 파싱 (객체에 중첩 {} 없음 → \n  {\n ... \n  }, 경계 안전)
function parseBlocks(text) {
  const out = [];
  const re = /\n {2}\{\n([\s\S]*?)\n {2}\},/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = m[1];
    const fld = (k) => {
      const mm = body.match(new RegExp(`(?:^|\\n) {4}${k}: '((?:[^'\\\\]|\\\\.)*)'`));
      return mm ? mm[1] : null;
    };
    out.push({
      full: `\n  {\n${body}\n  },`,
      body,
      id: fld('id'), slug: fld('slug'), nameKo: fld('nameKo'),
      regionKo: fld('regionKo'), region: fld('region'),
      category: (body.match(/category: '([^']+)'/) || [])[1] || '',
      address: fld('address'), openHours: fld('openHours'), nearbyStation: fld('nearbyStation'),
      lat: (body.match(/\n {4}lat: ([\d.]+)/) || [])[1] || null,
    });
  }
  return out;
}

function escTs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s+/g, ' ').trim();
}

const prov = existsSync(PROV) ? JSON.parse(readFileSync(PROV, 'utf8')) : {};
const blocks = parseBlocks(text0);
console.log(`📦 venue ${blocks.length}곳 파싱`);

// ── seed-manual: 기존 비어있지 않은 필드를 manual 출처로 기록 ──
if (MODE_SEED) {
  let n = 0;
  for (const b of blocks) {
    const filled = {};
    for (const f of FIELDS) if (b[f]) filled[f] = b[f];
    if (Object.keys(filled).length) {
      prov[b.slug] = { source: 'manual', note: '게이트 도입 전 기존 입력', fields: Object.keys(filled), ...((prov[b.slug]) || {}) };
      n++;
    }
  }
  writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n');
  console.log(`✅ manual provenance ${n}곳 기록 → ${PROV}`);
  process.exit(0);
}

// ── Places 호출 ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').replace(/[\s·\-_/()]/g, '').toLowerCase();

// Places API (New) — 신규 GCP 키는 기본적으로 이 v1 엔드포인트만 활성(레거시=REQUEST_DENIED).
async function placesLookup(v) {
  const query = `${v.nameKo} ${v.regionKo || ''}`.trim();
  const ts = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.regularOpeningHours,places.location',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'ko', regionCode: 'KR' }),
  }).then((r) => r.json());
  if (ts.error) return { skip: `searchText ${ts.error.status || ts.error.code}` };
  const results = ts.places || [];
  if (!results.length) return { skip: 'searchText 결과 0' };
  // 이름 확실 일치만 채택(부분 포함, 불확실=skip)
  const nm = (p) => p.displayName?.text || '';
  const cand = results.find((p) => { const a = norm(nm(p)), b = norm(v.nameKo); return a.includes(b) || b.includes(a); });
  if (!cand) return { skip: `이름 불일치(top='${nm(results[0])}')` };
  const res = {
    place_id: cand.id,
    name: nm(cand),
    address: cand.formattedAddress || '',
    openHours: (cand.regularOpeningHours?.weekdayDescriptions || []).join(' / '),
    nearbyStation: '',
  };
  // 좌표(GeoCoordinates) — place_id로 검증된 실좌표만 채택. 지어내지 않음.
  if (cand.location) {
    const { latitude, longitude } = cand.location;
    res.lat = latitude;
    res.lng = longitude;
    // 가까운 지하철역(검증 가능). location 있으면 searchNearby.
    const nb = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'places.displayName',
      },
      body: JSON.stringify({
        includedTypes: ['subway_station'],
        maxResultCount: 1,
        rankPreference: 'DISTANCE',
        languageCode: 'ko',
        locationRestriction: { circle: { center: { latitude, longitude }, radius: 1500 } },
      }),
    }).then((r) => r.json());
    if (!nb.error && nb.places?.length) res.nearbyStation = nb.places[0].displayName?.text || '';
  }
  return res;
}

let text = text0;
let filledCount = 0;
const skipped = [];
let processed = 0;

// 선택적 보강용 키가 없으면 = 할 일 없음(빈 필드 자동채움은 옵션). 실패가 아니라 정상 스킵.
// (IndexNow/GSC 시크릿 부재 시 graceful skip 과 동일 패턴 — CI 가짜 빨강·노이즈 메일 방지)
if (!MODE_MOCK && !KEY) {
  console.log('⏭️  GOOGLE_PLACES_API_KEY 미설정 — Places 보강 건너뜀(정상). 활성화하려면 GH Secret 추가.');
  process.exit(0);
}

for (const b of blocks) {
  if (processed >= LIMIT) break;
  const need = FIELDS.filter((f) => !b[f]);
  const needGeo = !b.lat; // 좌표가 아직 없으면 geo 보강 대상
  if (!need.length && !needGeo) continue;
  processed++;

  let data;
  if (MODE_MOCK) {
    data = { place_id: `MOCK_${b.slug}`, name: b.nameKo, address: `[MOCK] ${b.regionKo} 테스트로${b.id}`, openHours: '월~일 18:00–02:00', nearbyStation: `${b.regionKo}역`, lat: 37.123456, lng: 127.123456 };
  } else {
    if (!KEY) { console.error('❌ GOOGLE_PLACES_API_KEY 없음'); process.exit(1); }
    try { data = await placesLookup(b); } catch (e) { data = { skip: `error ${e.message}` }; }
    await sleep(120);
  }
  if (data.skip) { skipped.push(`${b.nameKo}(${b.slug}): ${data.skip}`); continue; }

  let newBody = b.body;
  const got = [];
  for (const f of need) {
    if (data[f]) {
      newBody = newBody.replace(`    ${f}: ''`, `    ${f}: '${escTs(data[f])}'`);
      got.push(f);
    }
  }
  // 좌표는 숫자 필드(빈 placeholder 줄 없음) → slug 줄 뒤에 lat/lng 삽입
  if (needGeo && typeof data.lat === 'number' && typeof data.lng === 'number') {
    newBody = newBody.replace(/(\n {4}slug: '[^']*',)/, `$1\n    lat: ${data.lat},\n    lng: ${data.lng},`);
    got.push('geo');
  }
  if (!got.length) { skipped.push(`${b.nameKo}(${b.slug}): Places결과에 빈 필드 데이터 없음`); continue; }

  const newFull = `\n  {\n${newBody}\n  },`;
  text = text.split(b.full).join(newFull);
  // provenance 병합: 기존 manual(광고주/도입전) 출처는 source·note 보존하고 새로 채운 필드(geo 등)만 추가.
  //   덮어쓰면 기존 manual 필드 커버리지가 사라져 게이트가 "출처 미기재"로 막는다(값은 진짜 → 커버리지만 유지).
  const prev = prov[b.slug];
  const prevFields = (prev && Array.isArray(prev.fields)) ? prev.fields : [];
  const mergedFields = [...new Set([...prevFields, ...got])];
  prov[b.slug] = (prev && prev.source === 'manual')
    ? { ...prev, place_id: data.place_id, matchedName: data.name, fields: mergedFields, fetchedAt: new Date().toISOString().slice(0, 10) }
    : { source: 'google_places', place_id: data.place_id, matchedName: data.name, fields: mergedFields, fetchedAt: new Date().toISOString().slice(0, 10) };
  filledCount++;
  console.log(`  ✓ ${b.nameKo}: ${got.join('+')} 채움`);
}

if (filledCount) {
  writeFileSync(VENUES, text);
  writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n');
}
console.log(`\n✅ ${filledCount}곳 채움 / ${skipped.length}곳 SKIP(불확실=안 지어냄)`);
if (skipped.length) { console.log('— SKIP 목록 —'); for (const s of skipped) console.log('  · ' + s); }
