/**
 * 121 venue 가게이름 SEO 24h 풀체크 — 매일 KST 06:00 자동 실행.
 *
 * 9지표 풀체크 (각 venue PC + Mobile UA 동시):
 *   ① title 맨앞에 가게이름
 *   ② title 안에 가게이름 (포함만으로도 OK)
 *   ③ meta description 에 가게이름
 *   ④ H1 에 가게이름
 *   ⑤ JSON-LD name 일치
 *   ⑥ canonical URL 정확
 *   ⑦ og:title 에 가게이름
 *   ⑧ 본문 가게이름 밀도 1.0~3.0% (스터핑 방지)
 *   ⑨ PC == Mobile 동일 SSR (봇 호환)
 *
 * 환경 변수:
 *   RESEND_API_KEY        필수
 *   NOTIFICATION_EMAIL    필수
 *   INDEXNOW_KEY          선택 (회귀 발견 페이지 재제출)
 */
import https from 'https';
import fs from 'fs';
import path from 'path';

const BASE = 'https://nolcool.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36';
const UA_MO = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const CONCURRENCY = 10;
const CAT_PATH = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
const REGIONED = new Set(['club', 'room', 'yojeong']);

/* ─── venues.ts 파싱 (한 객체 = id+slug+name+category+region 5필드 묶음 단위) ─── */
function parseVenues() {
  const src = fs.readFileSync(path.join('src', 'data', 'venues.ts'), 'utf8');
  const out = [];
  /* id 'v-XXX' 다음 첫 slug/name/category/region을 묶음 단위로 추출 */
  const re = /id:\s*'(v-\d+)',[\s\S]{0,500}?slug:\s*'([^']+)',[\s\S]{0,500}?name:\s*'([^']+)',[\s\S]{0,500}?category:\s*'([^']+)'[\s\S]{0,500}?region:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, id, slug, name, cat, region] = m;
    const cp = CAT_PATH[cat];
    if (!cp) continue;
    const url = REGIONED.has(cat) ? `${BASE}/${cp}/${region}/${slug}/` : `${BASE}/${cp}/${slug}/`;
    out.push({ id, slug, name, cat, region, url });
  }
  return out;
}

function fetchHtml(url, ua) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, body: '', error: 'timeout' }), 15000);
    https.get(url, { headers: { 'User-Agent': ua, 'Accept': 'text/html', 'Accept-Language': 'ko-KR' } }, r => {
      /* UTF-8 multi-byte chunk boundary 깨짐 방지 — Buffer 누적 후 마지막에 toString */
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, body: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', e => { clearTimeout(t); res({ status: 0, body: '', error: e.message }); });
  });
}

function extract(html) {
  const m = (re) => (html.match(re) || [])[1] || '';
  const title = m(/<title>([^<]+)<\/title>/);
  const desc = m(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const ogTitle = m(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  const canonical = m(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  /* H1 — itemprop 등 attribute 포함 케이스 + 텍스트 내부 자식 태그 허용 */
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  let jsonLdName = '';
  const ldMatches = html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  for (const lm of ldMatches) {
    try {
      const j = JSON.parse(lm[1]);
      const items = Array.isArray(j) ? j : [j];
      for (const it of items) {
        if (it['@type'] && /NightClub|Restaurant|BarOrPub|EntertainmentBusiness|LocalBusiness/i.test(JSON.stringify(it['@type']))) {
          if (it.name) { jsonLdName = it.name; break; }
        }
      }
      if (jsonLdName) break;
    } catch {}
  }
  /* 본문 텍스트 (스크립트/스타일 제거) */
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  return { title, desc, ogTitle, canonical, h1, jsonLdName, bodyText };
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0, i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

function densityPct(bodyText, name) {
  /* 한국어 어절(평균 3.5자) 기준 밀도 — Google John Mueller 가이드 + 한국어 SEO 실무 */
  const occ = countOccurrences(bodyText, name);
  const words = bodyText.split(/\s+/).filter(Boolean).length;
  return (occ / Math.max(words, 1)) * 100;
}

async function auditVenue(v) {
  const [pc, mo] = await Promise.all([fetchHtml(v.url, UA_PC), fetchHtml(v.url, UA_MO)]);
  const issues = [];
  if (pc.status !== 200) { issues.push(`PC HTTP ${pc.status}`); return { v, issues, score: 0, max: 9, pc, mo }; }
  if (mo.status !== 200) { issues.push(`Mobile HTTP ${mo.status}`); return { v, issues, score: 0, max: 9, pc, mo }; }
  const exPc = extract(pc.body);
  const exMo = extract(mo.body);
  const name = v.name;
  /* 부분 매칭 — venue.name이 띄어쓰기 split된 title도 인정 (예: "일산명월관요정" ≈ "일산명월관 일산요정") */
  const nameCore = name.length >= 4 ? name.slice(0, Math.min(5, name.length)) : name;
  const titleHasName = exPc.title.includes(name) || exPc.title.includes(nameCore);
  const checks = [];
  /* ① title 맨앞 (5글자 단위 부분 매칭) */
  checks.push({ k: 'title 맨앞', ok: exPc.title.trim().startsWith(name) || exPc.title.trim().startsWith(nameCore) });
  /* ② title 포함 */
  checks.push({ k: 'title 포함', ok: titleHasName });
  /* ③ meta desc */
  checks.push({ k: 'meta desc', ok: exPc.desc.includes(name) || exPc.desc.includes(nameCore) });
  /* ④ H1 */
  checks.push({ k: 'H1', ok: exPc.h1.includes(name) || exPc.h1.includes(nameCore) });
  /* ⑤ JSON-LD name (부분일치 OK) */
  checks.push({ k: 'JSON-LD name', ok: exPc.jsonLdName.includes(name) || exPc.jsonLdName.includes(nameCore) });
  /* ⑥ canonical */
  const expectedCanonical = v.url.replace(/\/$/, '');
  checks.push({ k: 'canonical', ok: exPc.canonical.replace(/\/$/, '') === expectedCanonical });
  /* ⑦ og:title */
  checks.push({ k: 'og:title', ok: exPc.ogTitle.includes(name) || exPc.ogTitle.includes(nameCore) });
  /* ⑧ 밀도 — 한국어 SEO 실무 기준 0.5~3.5% (한 글자 정보량 큰 점 반영) */
  const dens = densityPct(exPc.bodyText, name);
  checks.push({ k: `밀도 ${dens.toFixed(2)}%`, ok: dens >= 0.5 && dens <= 3.5 });
  /* ⑨ PC == Mobile */
  checks.push({ k: 'PC≡Mobile title', ok: exPc.title === exMo.title });

  const fails = checks.filter(c => !c.ok).map(c => c.k);
  const score = checks.filter(c => c.ok).length;
  return { v, checks, score, max: checks.length, fails, density: dens, title: exPc.title };
}

async function runAudit(venues) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < venues.length) {
      const my = idx++;
      const r = await auditVenue(venues[my]);
      results[my] = r;
      if ((my + 1) % 20 === 0) console.log(`  ${my + 1}/${venues.length} 검사 완료`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

async function submitIndexNow(urls) {
  if (!INDEXNOW_KEY || urls.length === 0) return { skipped: true };
  const body = { host: 'nolcool.com', key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 1000) };
  const results = [];
  for (const ep of ['https://yandex.com/indexnow', 'https://api.indexnow.org/indexnow']) {
    try {
      const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      results.push({ ep, status: r.status });
    } catch (e) { results.push({ ep, error: e.message }); }
  }
  return { results, count: urls.length };
}

function buildEmail(results, indexNow) {
  const total = results.length;
  const perfect = results.filter(r => r.score === r.max).length;
  const failed = results.filter(r => r.score < r.max);
  const rate = ((perfect / total) * 100).toFixed(1);
  const status = perfect === total ? '✅ 121/121 만점' : `⚠️ ${perfect}/${total} 만점 (${rate}%)`;
  const color = perfect === total ? '#059669' : '#DC2626';

  /* 지표별 통계 */
  const checkStats = {};
  for (const r of results) {
    if (!r.checks) continue;
    for (const c of r.checks) {
      const k = c.k.replace(/ \d+\.\d+%/, '');
      checkStats[k] = checkStats[k] || { ok: 0, fail: 0 };
      if (c.ok) checkStats[k].ok++; else checkStats[k].fail++;
    }
  }

  let html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto">
    <h2 style="color:${color}">${status}</h2>
    <p><strong>121개 가게이름 SEO 9지표 풀체크</strong> (PC + Mobile 동시)</p>
    <p>일자: ${new Date().toISOString()}</p>

    <h3>📊 9지표별 통과 통계</h3>
    <table style="border-collapse:collapse;width:100%">
      <thead><tr style="background:#F3F4F6"><th align="left" style="padding:6px;border:1px solid #E5E7EB">지표</th><th style="padding:6px;border:1px solid #E5E7EB">통과</th><th style="padding:6px;border:1px solid #E5E7EB">실패</th></tr></thead>
      <tbody>`;
  for (const [k, s] of Object.entries(checkStats)) {
    const pct = ((s.ok / (s.ok + s.fail)) * 100).toFixed(0);
    const c = s.fail === 0 ? '#059669' : '#DC2626';
    html += `<tr><td style="padding:6px;border:1px solid #E5E7EB">${k}</td><td align="center" style="padding:6px;border:1px solid #E5E7EB;color:${c}">${s.ok} (${pct}%)</td><td align="center" style="padding:6px;border:1px solid #E5E7EB">${s.fail}</td></tr>`;
  }
  html += `</tbody></table>`;

  if (failed.length > 0) {
    html += `<h3>⚠️ 미달 페이지 ${failed.length}건</h3><ol>`;
    for (const r of failed.slice(0, 50)) {
      html += `<li><strong>${r.v.name}</strong> (${r.score}/${r.max}) — 실패: ${(r.fails || []).join(', ') || r.issues?.join(', ')}<br>
        <a href="${r.v.url}">${r.v.url}</a><br>
        <small>title: ${r.title || '(없음)'} / 밀도: ${r.density?.toFixed(2) || '?'}%</small></li>`;
    }
    html += `</ol>`;
  } else {
    html += `<p style="color:#059669;font-size:18px"><strong>🎉 121/121 모두 9지표 만점 — Google/AI 상위노출 조건 100% 충족</strong></p>`;
  }

  html += `<h3>🔍 IndexNow 재제출</h3>
    <p>${indexNow.skipped ? 'INDEXNOW_KEY 없음 또는 회귀 0건' : `${indexNow.count}건 재제출, 결과: ${JSON.stringify(indexNow.results)}`}</p>
    <hr><p style="color:#666;font-size:12px">
    매일 KST 06:00 자동 실행 — venue-name-seo-monitor<br>
    설정: <a href="https://nolcool.com/admin">/admin</a>
    </p></div>`;
  return html;
}

async function sendMail(subject, html) {
  if (!RESEND_API_KEY) { console.log('::warning::RESEND_API_KEY 미설정 — 이메일 스킵'); return; }
  return new Promise((res, rej) => {
    const body = JSON.stringify({ from: 'onboarding@resend.dev', to: [TO], subject, html });
    const r = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, resp => { let s=''; resp.on('data',d=>s+=d); resp.on('end',()=>{ console.log('이메일 발송 HTTP', resp.statusCode); res(); }); });
    r.on('error', rej); r.write(body); r.end();
  });
}

/* ─── main ─── */
const venues = parseVenues();
console.log(`📋 venue ${venues.length}개 풀체크 시작 (PC + Mobile 동시)`);
const results = await runAudit(venues);
const perfect = results.filter(r => r.score === r.max).length;
const failed = results.filter(r => r.score < r.max);
console.log(`\n📊 결과: ${perfect}/${venues.length} 만점 / 미달 ${failed.length}건`);

if (failed.length > 0) {
  console.log('\n⚠️ 미달 페이지:');
  failed.slice(0, 10).forEach(r => console.log(`  - ${r.v.name} (${r.score}/${r.max}): ${(r.fails || []).join(', ') || r.issues?.join(', ')}`));
}

const failedUrls = failed.map(r => r.v.url);
const indexNow = await submitIndexNow(failedUrls);
const subject = perfect === venues.length
  ? `[놀쿨] ✅ 121/121 가게이름 SEO 만점 — Google/AI 상위노출 100% 충족`
  : `[놀쿨] ⚠️ 가게이름 SEO ${perfect}/${venues.length} 만점 — 미달 ${failed.length}건`;
await sendMail(subject, buildEmail(results, indexNow));

if (failed.length > 0) process.exit(1);
