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

async function placesLookup(v) {
  const q = encodeURIComponent(`${v.nameKo} ${v.regionKo || ''}`.trim());
  const ts = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&language=ko&region=kr&key=${KEY}`).then((r) => r.json());
  if (ts.status !== 'OK' || !ts.results?.length) return { skip: `textsearch ${ts.status}` };
  // 이름 확실 일치만 채택(부분 포함, 불확실=skip)
  const cand = ts.results.find((r) => { const a = norm(r.name), b = norm(v.nameKo); return a.includes(b) || b.includes(a); });
  if (!cand) return { skip: `이름 불일치(top='${ts.results[0].name}')` };
  const pid = cand.place_id;
  const det = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${pid}&fields=name,formatted_address,opening_hours,geometry&language=ko&key=${KEY}`).then((r) => r.json());
  if (det.status !== 'OK') return { skip: `details ${det.status}` };
  const d = det.result;
  const res = { place_id: pid, name: d.name, address: d.formatted_address || '', openHours: (d.opening_hours?.weekday_text || []).join(' / '), nearbyStation: '' };
  // 가까운 지하철역(검증 가능). geometry 있으면 nearbysearch.
  if (d.geometry?.location) {
    const { lat, lng } = d.geometry.location;
    const nb = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=subway_station&language=ko&key=${KEY}`).then((r) => r.json());
    if (nb.status === 'OK' && nb.results?.length) res.nearbyStation = nb.results[0].name;
  }
  return res;
}

let text = text0;
let filledCount = 0;
const skipped = [];
let processed = 0;

for (const b of blocks) {
  if (processed >= LIMIT) break;
  const need = FIELDS.filter((f) => !b[f]);
  if (!need.length) continue;
  processed++;

  let data;
  if (MODE_MOCK) {
    data = { place_id: `MOCK_${b.slug}`, name: b.nameKo, address: `[MOCK] ${b.regionKo} 테스트로${b.id}`, openHours: '월~일 18:00–02:00', nearbyStation: `${b.regionKo}역` };
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
  if (!got.length) { skipped.push(`${b.nameKo}(${b.slug}): Places결과에 빈 필드 데이터 없음`); continue; }

  const newFull = `\n  {\n${newBody}\n  },`;
  text = text.split(b.full).join(newFull);
  prov[b.slug] = { source: 'google_places', place_id: data.place_id, matchedName: data.name, fields: got, fetchedAt: new Date().toISOString().slice(0, 10) };
  filledCount++;
  console.log(`  ✓ ${b.nameKo}: ${got.join('+')} 채움`);
}

if (filledCount) {
  writeFileSync(VENUES, text);
  writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n');
}
console.log(`\n✅ ${filledCount}곳 채움 / ${skipped.length}곳 SKIP(불확실=안 지어냄)`);
if (skipped.length) { console.log('— SKIP 목록 —'); for (const s of skipped) console.log('  · ' + s); }
