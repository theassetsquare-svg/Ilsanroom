#!/usr/bin/env node
/**
 * [콘텐츠/정직] src/pages 본문에서 '출처 없는 주장·창작 사실·과장 미사여구'를 빌드에서 영구 차단.
 *
 * 배경(CLAUDE.md #0 정직 불변식): 끝까지 읽히는 콘텐츠 = 정확한 사실이다. 그러나 광고주 데이터에
 *   없는 정보를 지어내면(수용인원·장비 출처·지역 유일/최대·셀럽 목격담) — (1) 사실이 아니면 신뢰 사망,
 *   (2) Google 신뢰성·scaled-content 페널티 = 도메인 전체 사망. "확인 안 되면 비워 둔다"가 원칙.
 *   2026-06-12 /clubs/ React 본문에서 "1,000명 메가 플로어·일본·유럽 직수입 장비·충북 유일·셀럽 출몰"
 *   같은 검증 불가 단정을 제거했고, 이 게이트로 다시 기어들지 못하게 잠근다.
 *
 * 막는 패턴 — 출처 없이 단정하면 위험한 것만(정상 카피 오탐 최소화). 사실 표기·실수치는 허용.
 * 양방향: 정상 PASS + 아래 패턴 주입 시 FAIL.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// src/pages(React 본문) + src/data(venue 마스터·매거진 HTML이 detail/지역/태그/매거진/llms.txt로 흘러 들어감)까지 전 페이지 커버
const ROOTS = ['src/pages'];
const EXTRA_FILES = ['src/data/venues.ts', 'src/data/magazine-articles.ts'];

const BANNED = [
  { re: /직수입/, why: '장비·술 수입 출처 주장(검증 불가)' },
  { re: /메가\s?플로어/, why: '검증 안 된 수용 규모 과장' },
  { re: /[\d,]+\s*명\s*(?:넘게|이상)\s*(?:들어|수용)/, why: '검증 안 된 수용인원 단정' },
  // 지역명 뒤에 권/도/북부 등 연결어가 끼어도(예: "충청권 유일", "경기 북부 유일") 잡는다
  { re: /(?:충북|충남|충청|경북|경남|전북|전남|강원|전국|국내|세계|경기|서울|인천|대전|대구|부산|광주|울산|일산|청담|강남|홍대|이태원)\s*(?:권|도|북부|남부|동부|서부|일대|지역)?\s*유일/, why: '출처 없는 "유일" 주장' },
  { re: /(?:국내|세계|업계)\s*최[대고]/, why: '출처 없는 "최대·최고" 주장' },
  { re: /셀럽이?\s*(?:자주\s*)?출몰/, why: '검증 불가 셀럽 목격담' },
  // 지어낸 후기/사례 단정(예: "…성사됐다는 실제 후기도 있다", "…대접받는다는 후기")
  { re: /(?:[가-힣]다는|라는)\s*(?:실제\s*)?후기/, why: '출처 없는 창작 후기 단정' },
  { re: /후기도\s*있다/, why: '출처 없는 창작 후기 단정' },
  // 지어낸 비율 단정(예: "1인 고객 비율이 절반에 가깝다")
  { re: /절반에\s*가까/, why: '출처 없는 비율 단정' },
  { re: /(?:비율|손님|고객)[이가]?\s*절반/, why: '출처 없는 비율 단정' },
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const fp = join(dir, name);
    const st = statSync(fp);
    if (st.isDirectory()) out.push(...walk(fp));
    else if (/\.tsx?$/.test(name)) out.push(fp);
  }
  return out;
}

const targets = [...ROOTS.flatMap(walk), ...EXTRA_FILES];
const errors = [];
for (const fp of targets) {
  const src = readFileSync(fp, 'utf8');
  for (const { re, why } of BANNED) {
    const m = src.match(re);
    if (m) errors.push(`${fp}: "${m[0]}" — ${why}`);
  }
}

if (errors.length) {
  console.error(`\n❌ [콘텐츠/정직] 콘텐츠 정직 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n광고주 데이터에 없는 사실을 지어내지 마세요. 확인 안 되면 비워 둡니다(틀린 사실=신뢰 사망=Google 페널티). 배포 차단.\n');
  process.exit(1);
}

console.log(`✅ [콘텐츠/정직] 콘텐츠 정직 게이트 PASS — src/pages + src/data(venues·magazine) 전 페이지 본문에 출처 없는 수용인원·장비출처·유일/최대·셀럽 목격담·창작후기·비율단정 0 (${targets.length}파일 검사)`);
