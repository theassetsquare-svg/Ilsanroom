#!/usr/bin/env node
// 시즌41 — 사람 톤 50개 체크 (v16 Part 4) 핵심 지표 측정
// src/data/venues.ts의 120개 venue description 검사 → 평균 점수 / 분포 / 약한 venue 식별
//
// 8개 핵심 지표 (0~1 점수 합산 → 8점 만점):
//  1. burstiness     문장 길이 표준편차 ≥ 5 (사람은 들쭉날쭉)
//  2. first-person   "우리/내가/솔직히/진짜로/난" 1회+
//  3. casual         "ㅋㅋ/근데/되게/꽤/좀/막/진짜/완전" 1회+
//  4. ending-variety 종결어 종류 (-다/-네/-야/-군/-요/-습니다) 3+종
//  5. ai-cliche-zero 시즌40 가드 패턴 0건
//  6. concrete-num   구체 숫자 ("3분/5명/10시") 2회+
//  7. emotion        "진짜/별로/완전/끝났/대박" 1회+
//  8. avg-sentence   평균 문장 길이 40자 이내 (AI는 길게 늘이기)
import { readFileSync } from 'node:fs';

const RAW = readFileSync('src/data/venues.ts', 'utf8');

// description: '...' 블록 추출 (가게이름 묶음)
const blocks = [...RAW.matchAll(/nameKo:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'/g)];

function stdev(arr) {
  if (!arr.length) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

const AI_CLICHE = [
  /자리잡은|자리잡고\s*있/, /잊지\s*못할/, /특별한\s*경험/, /추천\s*드립/,
  /본\s*(가게|클럽|업소|호빠|요정|룸|라운지|나이트)는/, /방문하시는\s*분들/,
  /고객\s*여러분/, /당점\s*(에서|은|의)/, /저희\s*(클럽|룸|업소|가게|라운지|호빠|요정)\s*에서는/,
  /고품격\s*서비스/, /엄선된\s*[가-힣]/, /강력\s*추천/, /필수\s*방문/,
  /후회\s*없으/, /만족스러우실/, /탁월한\s*[가-힣]/, /최고의\s*선택/,
  /분석한\s*결과/, /종합\s*평가/, /프리미엄\s*(클럽|라운지|호빠|요정|나이트|업소|가게)/,
];

function score(desc) {
  const sentences = desc.split(/[.!?。]\s*/).filter(s => s.length > 5);
  const lens = sentences.map(s => s.length);
  const sd = stdev(lens);
  const avgLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;

  // 1. burstiness
  const burst = sd >= 5 ? 1 : 0;
  // 2. first-person
  const fp = /우리|내가|솔직히|진짜로|난\s/.test(desc) ? 1 : 0;
  // 3. casual particle
  const casual = /ㅋㅋ|근데|되게|\b꽤\b|\b좀\b|\b막\b|진짜|완전/.test(desc) ? 1 : 0;
  // 4. ending variety
  const endings = new Set();
  for (const s of sentences) {
    if (/다$/.test(s)) endings.add('다');
    if (/네$/.test(s)) endings.add('네');
    if (/야$/.test(s)) endings.add('야');
    if (/군$/.test(s)) endings.add('군');
    if (/요$/.test(s)) endings.add('요');
    if (/습니다$/.test(s)) endings.add('습니다');
  }
  const ev = endings.size >= 3 ? 1 : 0;
  // 5. AI cliche zero
  const cz = AI_CLICHE.some(re => re.test(desc)) ? 0 : 1;
  // 6. concrete numbers
  const nums = (desc.match(/\d+(\s*(분|시|명|일|호선|개|년|만|시간|분간|회|번|미터|cm|m|초|일째|평|층|점|m²))/g) || []).length;
  const cn = nums >= 2 ? 1 : 0;
  // 7. emotion
  const em = /진짜\s*[가-힣]|별로|완전|끝났|대박|쩐다|미쳤|쩔어/.test(desc) ? 1 : 0;
  // 8. avg sentence length ≤ 40
  const al = avgLen > 0 && avgLen <= 40 ? 1 : 0;

  return { burst, fp, casual, ev, cz, cn, em, al, sd: sd.toFixed(1), avgLen: avgLen.toFixed(1), total: burst + fp + casual + ev + cz + cn + em + al };
}

const results = [];
for (const m of blocks) {
  const name = m[1];
  const desc = m[2];
  if (desc.length < 200) continue;
  const s = score(desc);
  results.push({ name, ...s });
}

const total = results.length;
const sumByKey = (k) => results.reduce((a, r) => a + r[k], 0);
const avgScore = (sumByKey('total') / total).toFixed(2);

console.log(`\n📊 시즌41 — 사람 톤 8지표 / ${total}개 venue description`);
console.log(`   평균 점수: ${avgScore} / 8`);
console.log(`   지표별 통과율:`);
console.log(`   • burstiness (문장길이 std ≥5):  ${sumByKey('burst')}/${total} (${(sumByKey('burst')/total*100).toFixed(0)}%)`);
console.log(`   • first-person (1인칭):           ${sumByKey('fp')}/${total} (${(sumByKey('fp')/total*100).toFixed(0)}%)`);
console.log(`   • casual (디시 톤):              ${sumByKey('casual')}/${total} (${(sumByKey('casual')/total*100).toFixed(0)}%)`);
console.log(`   • ending variety (종결어 3+종): ${sumByKey('ev')}/${total} (${(sumByKey('ev')/total*100).toFixed(0)}%)`);
console.log(`   • AI cliche zero:                ${sumByKey('cz')}/${total} (${(sumByKey('cz')/total*100).toFixed(0)}%)`);
console.log(`   • concrete numbers (2+회):       ${sumByKey('cn')}/${total} (${(sumByKey('cn')/total*100).toFixed(0)}%)`);
console.log(`   • emotion expression:            ${sumByKey('em')}/${total} (${(sumByKey('em')/total*100).toFixed(0)}%)`);
console.log(`   • avg sentence ≤ 40자:           ${sumByKey('al')}/${total} (${(sumByKey('al')/total*100).toFixed(0)}%)`);

// 약한 venue (score < 4) 식별
const weak = results.filter(r => r.total < 4).sort((a, b) => a.total - b.total);
console.log(`\n⚠️  약한 venue (score < 4): ${weak.length}건`);
for (const w of weak.slice(0, 15)) {
  console.log(`   ${w.total}/8 — ${w.name} (std=${w.sd}, avgLen=${w.avgLen})`);
}

// 보고만, 차단 안 함
process.exit(0);
