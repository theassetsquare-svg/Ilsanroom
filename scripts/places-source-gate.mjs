#!/usr/bin/env node
/**
 * [Task2/정직] venue 의 address/openHours/nearbyStation 은 "출처가 증명된 값"만 허용.
 *
 * 배경: 주소·영업시간을 손으로 지어내면 → 틀린 사실=신뢰 사망=Google 페널티(CLAUDE.md #0).
 *   그래서 이 필드들이 비어있지 않으면 반드시 src/data/places-provenance.json 에
 *   출처(google_places=place_id / manual=게이트 도입 전 기존입력)가 있어야 한다.
 *   출처 없이 값이 들어오면 빌드 차단. 별점·리뷰는 provenance에 절대 못 들어온다.
 * 양방향: 정상 PASS + 출처 없는 주소 주입 시 FAIL.
 */
import { readFileSync, existsSync } from 'node:fs';

const VENUES = 'src/data/venues.ts';
const PROV = 'src/data/places-provenance.json';
const FIELDS = ['address', 'openHours', 'nearbyStation'];
const ALLOWED_PROV_KEYS = new Set(['source', 'place_id', 'matchedName', 'fields', 'fetchedAt', 'note']);

const text = readFileSync(VENUES, 'utf8');
const prov = existsSync(PROV) ? JSON.parse(readFileSync(PROV, 'utf8')) : {};

const blocks = [];
{
  const re = /\n {2}\{\n([\s\S]*?)\n {2}\},/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = m[1];
    const fld = (k) => { const mm = body.match(new RegExp(`(?:^|\\n) {4}${k}: '((?:[^'\\\\]|\\\\.)*)'`)); return mm ? mm[1] : null; };
    const o = { slug: fld('slug'), nameKo: fld('nameKo') };
    for (const f of FIELDS) o[f] = fld(f);
    o.lat = (body.match(/\n {4}lat: ([\d.]+)/) || [])[1] || null;
    blocks.push(o);
  }
}

const errors = [];
for (const b of blocks) {
  for (const f of FIELDS) {
    if (b[f]) {
      const p = prov[b.slug];
      if (!p) { errors.push(`${b.nameKo}(${b.slug}).${f}="${b[f]}" — provenance 없음(출처 없는 ${f} 입력 금지)`); continue; }
      if (p.source === 'manual') continue; // 게이트 도입 전 기존입력 grandfather
      if (p.source !== 'google_places' || !p.place_id) errors.push(`${b.nameKo}(${b.slug}).${f} — provenance source/place_id 불완전`);
      else if (Array.isArray(p.fields) && !p.fields.includes(f)) errors.push(`${b.nameKo}(${b.slug}).${f} — provenance에 ${f} 출처 미기재`);
    }
  }
  // 좌표(geo)는 신규 핵심 데이터 → manual grandfather 없이 항상 엄격: place_id + geo 출처 필수(추정·날조 금지)
  if (b.lat) {
    const p = prov[b.slug];
    if (!p || !p.place_id) errors.push(`${b.nameKo}(${b.slug}).geo=${b.lat} — place_id 출처 없음(좌표는 Places 검증값만, 지어내기 금지)`);
    else if (Array.isArray(p.fields) && !p.fields.includes('geo')) errors.push(`${b.nameKo}(${b.slug}).geo — provenance에 geo 출처 미기재`);
  }
}
// 별점·리뷰가 provenance로 새어들지 않게
for (const [slug, p] of Object.entries(prov)) {
  for (const k of Object.keys(p)) if (!ALLOWED_PROV_KEYS.has(k)) errors.push(`provenance[${slug}] 금지 키 "${k}" — 별점/리뷰 등 비허용 데이터`);
}

if (errors.length) {
  console.error(`\n❌ [Places/출처] 출처 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error('   - ' + e);
  console.error('\n주소·영업시간은 Google Places(place_id)로 검증된 값만 허용합니다. 지어내지 마세요. 배포 차단.\n');
  process.exit(1);
}
console.log(`✅ [Places/출처] 출처 게이트 PASS — address/openHours/nearbyStation 전부 출처 증명(google_places/manual), 별점·리뷰 유입 0`);
