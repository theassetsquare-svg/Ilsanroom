#!/usr/bin/env node
/**
 * SERP T1(페이지깜깜) 색인 재확인 — 매주 월 KST 10:15 자동 (serp-loop 10:45 직전)
 *
 * 배경(2026-07-25): 노출0 원인분석에서 T1 4곳(URL이 90일간 어떤 검색어로도 노출 0 = 색인 의심)
 * 발견 → IndexNow 핑 + sitemap 재제출 완료. 이 스크립트가 색인 됐는지 매주 자동 재확인한다.
 *
 * 동작 (자기수렴 — 정상이 되면 스스로 침묵·종료):
 *   1) scripts/.serp-t1-watch.json 감시 목록 로드 — 비어 있으면 즉시 종료 (API 0콜)
 *   2) URL Inspection API로 각 URL 색인 확인 (감시 N개만, 쿼터 부담 0)
 *   3) 색인 확인(verdict PASS) → 목록에서 제거 (워크플로가 커밋 → 다음 주부터 검사 제외)
 *   4) 아직 미색인 → IndexNow 재핑 (정직한 재크롤 신호, 조작 0)
 *   5) 메일은 "해결됐을 때만" 1통 (색인 확인 1건 이상) — 미해결·정상은 침묵 (사장님 정책)
 *
 * 환경변수: GSC_SA_JSON / INDEXNOW_KEY / RESEND_API_KEY / NOTIFICATION_EMAIL
 */
import fs from 'node:fs';
import { getAccessToken, hasGscCredentials, SITE_PROPERTY } from './lib/gsc-auth.mjs';

const WATCH_FILE = 'scripts/.serp-t1-watch.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const watch = JSON.parse(fs.readFileSync(WATCH_FILE, 'utf8'));
if (!watch.urls?.length) { console.log('✅ 감시 목록 비어 있음 — 전부 색인 완료 상태. 종료.'); process.exit(0); }
if (!hasGscCredentials()) { console.log('⏭️  GSC_SA_JSON 미설정 — 스킵'); process.exit(0); }

async function inspect(token, inspectionUrl, attempt = 0) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl: SITE_PROPERTY, languageCode: 'ko-KR' }),
  });
  if (r.status === 429 && attempt < 3) { await sleep(2000 * (attempt + 1)); return inspect(token, inspectionUrl, attempt + 1); }
  if (!r.ok) return { verdict: `HTTP_${r.status}`, coverageState: '?' };
  const idx = (await r.json()).inspectionResult?.indexStatusResult || {};
  return { verdict: idx.verdict || 'UNKNOWN', coverageState: idx.coverageState || '?', lastCrawl: idx.lastCrawlTime || '' };
}

async function pingIndexNow(urls) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) { console.log('⏭️  INDEXNOW_KEY 없음 — 재핑 스킵'); return; }
  const body = JSON.stringify({ host: 'nolcool.com', key, keyLocation: 'https://nolcool.com/indexnow-key.txt', urlList: urls });
  for (const ep of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow']) {
    const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    console.log(`   📡 IndexNow ${ep.includes('bing') ? 'bing' : 'api'} → ${r.status}`);
  }
}

async function sendResolvedMail(resolved, remaining) {
  const KEY = process.env.RESEND_API_KEY;
  const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
  if (!KEY) { console.log('⏭️  RESEND_API_KEY 없음 — 메일 스킵'); return false; }
  const html = `
  <h2>✅ 노출0 T1 색인 해결 — ${resolved.length}곳</h2>
  <p style="font-size:13px;color:#444">90일간 검색에 전혀 안 뜨던(색인 의심) 페이지가 구글 색인 확인됐습니다. 감시 목록에서 자동 제거 — 이후 노출은 매주 월 serp-loop이 추적합니다.</p>
  <ul>${resolved.map((x) => `<li><code>${x.url.replace('https://nolcool.com', '')}</code> — ${x.coverageState}</li>`).join('')}</ul>
  ${remaining.length ? `<p style="font-size:12px;color:#888">남은 감시 ${remaining.length}곳은 다음 주 자동 재확인 (IndexNow 재핑 완료)</p>` : '<p style="font-size:12px;color:#16a34a">감시 목록 전부 해결 — 이 메일이 마지막입니다.</p>'}`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject: `✅ [놀쿨] 노출0 T1 색인 해결 ${resolved.length}곳 (감시 ${remaining.length}곳 남음)`, html }),
  });
  console.log(`   📧 해결 메일 → ${r.status}`);
  return r.ok;
}

(async () => {
  const token = await getAccessToken();
  if (!token) { console.log('⏭️  GSC 토큰 실패 — 스킵'); return; }
  console.log(`🔍 T1 색인 재확인 — 감시 ${watch.urls.length}곳`);
  const resolved = [], remaining = [];
  for (const url of watch.urls) {
    const res = await inspect(token, url);
    const ok = res.verdict === 'PASS';
    console.log(`   ${ok ? '✅ 색인됨' : '⏳ 미색인'} ${url.replace('https://nolcool.com', '')} — ${res.verdict} / ${res.coverageState}${res.lastCrawl ? ` / 마지막크롤 ${res.lastCrawl.slice(0, 10)}` : ''}`);
    (ok ? resolved : remaining).push({ url, coverageState: res.coverageState });
    await sleep(300);
  }
  if (remaining.length) await pingIndexNow(remaining.map((x) => x.url));
  let mail = 'SKIP';
  if (resolved.length) {
    fs.writeFileSync(WATCH_FILE, JSON.stringify({ ...watch, urls: remaining.map((x) => x.url) }, null, 2) + '\n');
    console.log(`   💾 감시 목록 갱신 — ${remaining.length}곳 남음`);
    mail = (await sendResolvedMail(resolved, remaining)) ? 'PASS' : 'FAIL';
  } else {
    console.log('   ⏳ 이번 주 색인 확인 0 — 침묵 (재핑만, 다음 주 재확인)');
  }
  console.log(`RESULT RESOLVED=${resolved.length} REMAINING=${remaining.length} MAIL=${mail}`);
})().catch((e) => { console.error('❌ 실패:', e); process.exit(1); });
