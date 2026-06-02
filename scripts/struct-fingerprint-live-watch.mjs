/**
 * 구조 지문(structural fingerprint) 라이브 24h watch.
 * 매일 KST 07:45 — 라이브 venue 상세 본문을 카테고리별 전수 쌍 5-gram Jaccard 비교.
 *
 * 빌드 가드(struct-fingerprint-audit.mjs)는 푸시 전 dist를 막지만, 이건 이미 배포된
 * 라이브를 감시한다(외부 데이터 변경·캐시·부분 배포로 인한 회귀 탐지).
 *
 * 회귀 사유:
 *  - FAIL > 15% : 두 페이지 본문이 프로그래매틱 복붙 수준으로 닮음 → 지메일 발송
 *  - WARN 10~15% : 정당 겹침(지역 키워드+실제 공유 데이터) → 메일 본문에 참고만, 단독 발송 X
 *
 * 환경:
 *  RESEND_API_KEY     필수 (없으면 메일 skip)
 *  NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
const BASE = 'https://nolcool.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const FAIL_AT = 0.15;
const WARN_AT = 0.10;

function fetchText(url) {
  const once = () => fetch(url, { headers: { 'User-Agent': 'NolcoolFingerprintWatch/1.0' } })
    .then(r => r.ok ? r.text() : '').catch(() => '');
  // transient 빈 응답 1회 재시도 (false-positive 차단)
  return once().then(t => t ? t : new Promise(rs => setTimeout(() => once().then(rs), 5000)));
}
function articleText(html) {
  const m = html.match(/<article[\s\S]*?<\/article>/);
  const body = m ? m[0] : '';
  return body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function shingles(text, n = 5) {
  const toks = text.split(/\s+/);
  const s = new Set();
  for (let i = 0; i + n <= toks.length; i++) s.add(toks.slice(i, i + n).join(' '));
  return s;
}
function jaccard(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); }

async function main() {
  const sm = await fetchText(`${BASE}/sitemap.xml`);
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  // 카테고리 접두 + 1개 이상 하위 세그먼트(= 카테고리 인덱스 제외). clubs는 3-seg, nights/hoppa/lounges는 2-seg.
  // URL 모양이 아닌 본문 내용(article + itemprop=name)으로 venue 상세를 최종 판별 → 두 구조 모두 robust, listing 제외.
  const byCat = {};
  for (const u of urls) {
    const mm = u.match(/^https:\/\/nolcool\.com\/(clubs|nights|lounges|rooms|yojeong|hoppa)\/[^/]+(\/[^/]+)?\/?$/);
    if (mm) (byCat[mm[1]] = byCat[mm[1]] || []).push(u);
  }

  const fails = [], warns = [];
  const catStats = [];
  let totalVenues = 0;
  for (const cat of Object.keys(byCat)) {
    const arts = [];
    for (const u of byCat[cat]) {
      const h = await fetchText(u);
      // 실제 venue 상세만: <article> + itemprop="name" (region/카테고리 listing 자동 제외)
      if (!/itemprop="name"/.test(h) || !/<article/.test(h)) continue;
      const t = articleText(h);
      if (t.length > 200) arts.push({ u: u.replace(BASE, ''), sh: shingles(t) });
    }
    totalVenues += arts.length;
    if (arts.length < 2) { catStats.push({ cat, n: arts.length, avg: 0, max: 0 }); continue; }
    let sum = 0, pairs = 0, maxJ = 0;
    for (let i = 0; i < arts.length; i++) for (let j = i + 1; j < arts.length; j++) {
      const J = jaccard(arts[i].sh, arts[j].sh); sum += J; pairs++;
      if (J > maxJ) maxJ = J;
      if (J > FAIL_AT) fails.push({ cat, a: arts[i].u, b: arts[j].u, J });
      else if (J > WARN_AT) warns.push({ cat, a: arts[i].u, b: arts[j].u, J });
    }
    catStats.push({ cat, n: arts.length, avg: sum / pairs, max: maxJ });
  }

  for (const s of catStats) console.log(`[${s.cat}] n=${s.n} 평균 ${(s.avg * 100).toFixed(1)}% 최대 ${(s.max * 100).toFixed(1)}%`);
  console.log(`\n📊 FAIL ${fails.length}쌍 / WARN ${warns.length}쌍`);

  if (fails.length > 0) {
    fails.sort((x, y) => y.J - x.J);
    warns.sort((x, y) => y.J - x.J);
    await sendMail({ fails, warns, catStats, totalVenues });
    process.exit(1);
  }
  console.log('✅ 라이브 구조 지문 정상 (FAIL 0) — 메일 발송 안 함');
}

async function sendMail({ fails, warns, catStats, totalVenues }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const row = (p, color) => `<tr><td style="border:1px solid #E5E7EB;padding:4px">${esc(p.cat)}</td><td style="border:1px solid #E5E7EB;padding:4px;color:${color};font-weight:bold">${(p.J * 100).toFixed(1)}%</td><td style="border:1px solid #E5E7EB;padding:4px"><a href="${BASE}${esc(p.a)}">${esc(p.a)}</a></td><td style="border:1px solid #E5E7EB;padding:4px"><a href="${BASE}${esc(p.b)}">${esc(p.b)}</a></td></tr>`;
  const failRows = fails.map(p => row(p, '#DC2626')).join('');
  const warnRows = warns.slice(0, 15).map(p => row(p, '#D97706')).join('');
  const statRows = catStats.map(s => `<tr><td style="border:1px solid #E5E7EB;padding:4px">${s.cat}</td><td style="border:1px solid #E5E7EB;padding:4px">${s.n}</td><td style="border:1px solid #E5E7EB;padding:4px">${(s.avg * 100).toFixed(1)}%</td><td style="border:1px solid #E5E7EB;padding:4px">${(s.max * 100).toFixed(1)}%</td></tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:820px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[🛑 구조 지문 회귀 — scaled-content-abuse 위험]</h2>
    <p style="color:#666;font-size:13px">측정: ${kst} · 라이브 venue ${totalVenues}개 · 임계 FAIL&gt;15% / WARN&gt;10%</p>
    <p style="font-size:13px">두 페이지 본문이 프로그래매틱 복붙 수준으로 닮았습니다. 해당 venue의 고유 데이터(양주·룸·특징·한줄소개)를 보강해 5-gram Jaccard를 낮추세요.</p>
    <h3>🛑 FAIL (&gt;15%) — ${fails.length}쌍</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><th style="border:1px solid #E5E7EB;padding:4px">업종</th><th style="border:1px solid #E5E7EB;padding:4px">유사도</th><th style="border:1px solid #E5E7EB;padding:4px">페이지 A</th><th style="border:1px solid #E5E7EB;padding:4px">페이지 B</th></tr>${failRows}
    </table>
    ${warns.length ? `<h3>⚠️ WARN (10~15%, 참고) — ${warns.length}쌍 중 상위 15</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><th style="border:1px solid #E5E7EB;padding:4px">업종</th><th style="border:1px solid #E5E7EB;padding:4px">유사도</th><th style="border:1px solid #E5E7EB;padding:4px">페이지 A</th><th style="border:1px solid #E5E7EB;padding:4px">페이지 B</th></tr>${warnRows}
    </table>` : ''}
    <h3>카테고리별 요약</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><th style="border:1px solid #E5E7EB;padding:4px">업종</th><th style="border:1px solid #E5E7EB;padding:4px">n</th><th style="border:1px solid #E5E7EB;padding:4px">평균</th><th style="border:1px solid #E5E7EB;padding:4px">최대</th></tr>${statRows}
    </table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 07:45 — struct-fingerprint-live-watch.mjs (FAIL시만 발송)</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][🛑] 구조 지문 회귀 (FAIL ${fails.length}쌍 / WARN ${warns.length}쌍)`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
