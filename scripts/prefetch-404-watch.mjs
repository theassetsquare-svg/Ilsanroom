/**
 * 시즌71 — SafeLink prefetch 404 회귀 감시 (24h)
 *
 * 매일 KST 06:55 라이브 주요 페이지 (홈 + 매거진 + 카테고리)에서
 * SafeLink가 발사하는 prefetch fetch가 404 응답하는지 puppeteer로 측정.
 * 동적 라우트 (/community/post/{uuid}, /messages/*) prefetch 회귀시 메일.
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

function findChromium() {
  // 시즌160 — ENV 우선, 그 다음 실존 경로만 선택 (이전: candidates[0] 무조건 → GH Actions에서 nix 경로 미존재 fail)
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium',
  ].filter(Boolean);
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return candidates[0];
}

const TARGETS = [
  '/',
  '/magazine/',
  '/clubs/',
  '/nights/',
  '/rooms/',
  '/yojeong/',
  '/lounges/',
  '/hoppa/',
  '/community/',
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  const findings = [];
  for (const vp of [{ name: 'pc', w: 1280, h: 800 }, { name: 'mobile', w: 390, h: 844 }]) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h });
    for (const path of TARGETS) {
      const failed = [];
      const onResp = r => {
        if (r.status() === 404) {
          const u = r.url();
          if (u.includes('nolcool.com') && !/favicon|\.ico|\.png|\.jpg|\.webp|\.svg|\.css|\.js$/.test(u)) {
            failed.push(u.replace('https://nolcool.com', ''));
          }
        }
      };
      page.on('response', onResp);
      try {
        await page.goto('https://nolcool.com' + path, { waitUntil: 'networkidle0', timeout: 25000 });
        await new Promise(r => setTimeout(r, 1500));
      } catch { /* timeout OK */ }
      page.off('response', onResp);
      if (failed.length > 0) findings.push({ vp: vp.name, path, urls: failed.slice(0, 10) });
    }
    await page.close();
  }
  await browser.close();

  const total = findings.reduce((s, f) => s + f.urls.length, 0);
  console.log(`측정 완료: ${TARGETS.length} 페이지 × PC/Mobile`);
  console.log(`404 prefetch: ${total}건 (${findings.length}페이지)`);

  if (findings.length === 0) {
    console.log('✅ 회귀 없음 — 메일 발송 안 함');
    return;
  }

  await sendMail({ findings, total });
  process.exit(1);
}

async function sendMail({ findings, total }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';

  const rows = findings.map(f => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">[${esc(f.vp)}] ${esc(f.path)}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:11px;color:#DC2626">${f.urls.map(u => esc(u)).join('<br/>')}</td>
  </tr>`).join('');

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[⚠ 회귀] SafeLink prefetch 404 — ${total}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <p style="font-size:13px">prerender 없는 동적 라우트에 prefetch GET이 발사되어 404 응답.
    <code>src/components/ui/SafeLink.tsx</code>의 <code>DYNAMIC_PREFETCH_SKIP</code> 패턴에 추가 필요.</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px"><thead><tr style="background:#F3F4F6">
      <th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">소스 페이지</th>
      <th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left">404 URL</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 06:55 자동 — prefetch-404-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] SafeLink prefetch 404 ${total}건`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
