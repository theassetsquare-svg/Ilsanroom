/**
 * 카테고리 6페이지 부동산급 UI/UX 24h watch — 시즌155+157.
 * 매일 KST 14:05 — UI 패턴 회귀시만 메일.
 *
 * 검사 대상: /clubs/ /nights/ /lounges/ /rooms/ /yojeong/ /hoppa/
 *
 * UI 마커 (VenueListClient + CompareBar + RecentVenuesBar 빌드 산출물에 포함):
 *   1) data-venue-list-v2 (컴포넌트 마운트 마커)
 *   2) venue-sort (정렬 드롭다운 4종)
 *   3) venue-count (결과 카운트 + 정렬 라벨)
 *   4) active-filter (활성 필터 1-tap 해제 칩)
 *   5) venue-bookmark (즐겨찾기 ♥)
 *   6) venue-hover-preview (호버 미리보기)
 *   7) venue-sentinel (무한 스크롤 sentinel)
 *   8) scroll-top (맨 위로 버튼)
 *   9) venue-compare-check (시즌157C — 카드 좌측 상단 비교 체크박스)
 *  10) venue-compare-bar (시즌157C — 비교 sticky bar)
 *  11) recent-venues-bar (시즌157A — 최근 본 venue 바)
 *
 * 라이브는 SPA — 마커는 빌드된 JS chunk에 있다.
 * 각 카테고리 HTML의 <script src=...> chunk 1+개에 마커 모두 포함되면 OK.
 */
import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const BASE = 'https://nolcool.com';
const CATEGORIES = ['/clubs/', '/nights/', '/lounges/', '/rooms/', '/yojeong/', '/hoppa/'];
const MARKERS = [
  'data-venue-list-v2',
  'venue-sort',
  'venue-count',
  'active-filter',
  'venue-bookmark',
  'venue-hover-preview',
  'venue-sentinel',
  'scroll-top',
  /* 시즌157 — 부동산 UX 보강 3종 */
  'venue-compare-check',
  'venue-compare-bar',
  'recent-venues-bar',
];

function fetchUrl(url) {
  const _once = () => new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, body: '' }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolUiWatch/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, body: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, body: '' }); });
  });
  // 시즌176-2 — transient 5xx/timeout 1회 재시도
  return _once().then(r => (r.status === 200 || (r.status >= 400 && r.status < 500))
    ? r
    : new Promise(rs => setTimeout(() => _once().then(rs), 5000)));
}

function extractScripts(html) {
  const out = [];
  const re = /<script[^>]*\bsrc=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  const re2 = /<link[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+)["']/g;
  while ((m = re2.exec(html)) !== null) out.push(m[1]);
  return [...new Set(out)];
}

async function fetchChunk(s) {
  const full = s.startsWith('http') ? s : BASE + (s.startsWith('/') ? s : '/' + s);
  const cr = await fetchUrl(full);
  return { src: s, body: cr.body };
}

async function checkCategory(path) {
  const url = BASE + path;
  const r = await fetchUrl(url);
  if (r.status !== 200) return { path, ok: false, missing: [`HTTP ${r.status}`] };

  // 1-hop: HTML 자체 + eager chunks + 그 안에서 참조하는 lazy chunks (/assets/*.js)
  const eager = extractScripts(r.body).filter(s => s.endsWith('.js'));
  const visited = new Set();
  const missing = new Set(MARKERS);

  // HTML 본문 자체에서 마커 매칭
  for (const m of MARKERS) if (r.body.includes(m)) missing.delete(m);
  if (missing.size === 0) return { path, ok: true, missing: [] };

  // BFS 1-hop
  let queue = eager.slice(0, 30);
  for (let hop = 0; hop < 2 && queue.length && missing.size > 0; hop++) {
    const fresh = queue.filter(s => !visited.has(s));
    fresh.forEach(s => visited.add(s));
    const bodies = await Promise.all(fresh.slice(0, 40).map(fetchChunk));
    const next = new Set();
    for (const { body } of bodies) {
      for (const m of MARKERS) if (body.includes(m)) missing.delete(m);
      // 동적 import 참조 추출 — Vite는 "assets/X.js" (선행 슬래시 X) 형식으로 저장
      const refs = body.match(/(?:\/)?assets\/[A-Za-z0-9_\-]+\.js/g) || [];
      refs.forEach(r => next.add(r.startsWith('/') ? r : '/' + r));
    }
    queue = [...next];
  }

  return { path, ok: missing.size === 0, missing: [...missing] };
}

async function main() {
  const results = await Promise.all(CATEGORIES.map(checkCategory));
  const failed = results.filter(r => !r.ok);

  console.log('카테고리 부동산급 UI 24h watch');
  for (const r of results) {
    console.log(`  ${r.path} — ${r.ok ? '✅' : '❌'}${r.missing.length ? ' missing: ' + r.missing.join(',') : ''}`);
  }
  console.log('회귀:', failed.length, '/', results.length, '페이지');

  if (failed.length > 0) {
    await sendMail({ failed });
    process.exit(1);
  }
  console.log(`✅ 전 카테고리 ${MARKERS.length} UI 패턴 통과`);
}

async function sendMail({ failed }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const html = `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 카테고리 UI/UX 회귀] ${failed.length}/${CATEGORIES.length}페이지</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB">페이지</th><th style="border:1px solid #E5E7EB;padding:6px;background:#F9FAFB">누락 마커</th></tr>
      ${failed.map(f => `<tr><td style="border:1px solid #E5E7EB;padding:6px">${esc(f.path)}</td><td style="border:1px solid #E5E7EB;padding:6px;color:#DC2626">${esc(f.missing.join(', '))}</td></tr>`).join('')}
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 14:05 자동 — venue-list-ui-watch.mjs (시즌155)</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] 카테고리 UI/UX 회귀 ${failed.length}/${CATEGORIES.length}`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
