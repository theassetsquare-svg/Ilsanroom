/**
 * workflow-failure-monitor — 24h GH Actions 실패 집계 (1통 통합 메일)
 *
 * 매일 KST 09:00 실행. 최근 24h 전체 워크플로 런 조회 → 실패 카운트 → 1통 발송.
 * 개별 워크플로가 보내는 31개 실패 메일을 1통으로 통합.
 *
 * 환경:
 *   GH_TOKEN           필수 — GitHub API 접근 (workflow_run.list)
 *   REPO               기본 theassetsquare-svg/Ilsanroom
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 *
 * 정책 — 실패 0건이면 메일 skip (조용한 정상)
 */
import https from 'node:https';

const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const REPO = process.env.REPO || 'theassetsquare-svg/Ilsanroom';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

if (!TOKEN) { console.error('GH_TOKEN 또는 GITHUB_TOKEN 필요'); process.exit(1); }

function ghGet(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.github.com${path}`, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'nolcool-workflow-monitor/1.0',
      },
    }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch (e) { reject(new Error(`parse ${r.statusCode}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  /* 최근 24h 런 페이지네이션 — 100개씩 최대 5페이지 (500런) */
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let allRuns = [];
  for (let page = 1; page <= 5; page++) {
    const r = await ghGet(`/repos/${REPO}/actions/runs?per_page=100&page=${page}&created=>=${since}`);
    if (r.status !== 200) { console.error('GH API', r.status, JSON.stringify(r.body).slice(0, 200)); process.exit(1); }
    const runs = r.body.workflow_runs || [];
    allRuns = allRuns.concat(runs);
    if (runs.length < 100) break;
  }

  const completed = allRuns.filter(r => r.status === 'completed');
  const failed = completed.filter(r => r.conclusion === 'failure');
  const success = completed.filter(r => r.conclusion === 'success');
  const cancelled = completed.filter(r => r.conclusion === 'cancelled');

  /* 워크플로별 실패 집계 */
  const byName = {};
  for (const r of failed) {
    if (!byName[r.name]) byName[r.name] = { count: 0, latest: null, runs: [] };
    byName[r.name].count++;
    byName[r.name].runs.push({ id: r.id, url: r.html_url, created_at: r.created_at });
    if (!byName[r.name].latest || new Date(r.created_at) > new Date(byName[r.name].latest)) {
      byName[r.name].latest = r.created_at;
    }
  }

  console.log(`총 ${completed.length} 런 / 성공 ${success.length} / 실패 ${failed.length} / 취소 ${cancelled.length}`);
  console.log(`고유 실패 워크플로 ${Object.keys(byName).length}개`);

  if (failed.length === 0) {
    console.log('✅ 실패 0건 — 메일 skip');
    return;
  }

  /* 메일 발송 */
  // 2026-07-12 사장님 지시: daily-regression-digest 와 동일 실패 이중 발송 — 이쪽은 콘솔만(중복 제거). FORCE_EMAIL=1 만 발송.
  if (process.env.FORCE_EMAIL !== '1') { console.log('ℹ️ 회귀 다이제스트가 메일 담당 — 이쪽은 콘솔만'); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }

  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';

  const sortedNames = Object.entries(byName).sort((a, b) => b[1].count - a[1].count);
  const rows = sortedNames.map(([name, info]) => `<tr>
    <td style="border:1px solid #E5E7EB;padding:8px;font-size:13px">${esc(name)}</td>
    <td style="border:1px solid #E5E7EB;padding:8px;font-size:13px;text-align:center;color:#DC2626;font-weight:bold">${info.count}</td>
    <td style="border:1px solid #E5E7EB;padding:8px;font-size:11px">${info.latest.replace('T', ' ').slice(0, 19)}</td>
    <td style="border:1px solid #E5E7EB;padding:8px;font-size:11px"><a href="${esc(info.runs[0].url)}">최근 런 →</a></td>
  </tr>`).join('');

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[놀쿨] 24h 워크플로 실패 집계 — ${failed.length}건</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst} / 윈도우: 최근 24시간</p>

    <table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:20px">
      <tr><td style="border:1px solid #E5E7EB;padding:10px;background:#F8F9FA">총 런</td><td style="border:1px solid #E5E7EB;padding:10px;text-align:right;font-weight:bold">${completed.length}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:10px;background:#F8F9FA">✅ 성공</td><td style="border:1px solid #E5E7EB;padding:10px;text-align:right;color:#059669;font-weight:bold">${success.length}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:10px;background:#F8F9FA">🛑 실패</td><td style="border:1px solid #E5E7EB;padding:10px;text-align:right;color:#DC2626;font-weight:bold;font-size:18px">${failed.length} (${Object.keys(byName).length}종)</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:10px;background:#F8F9FA">취소</td><td style="border:1px solid #E5E7EB;padding:10px;text-align:right">${cancelled.length}</td></tr>
    </table>

    <h3>실패 워크플로별 빈도</h3>
    <table style="border-collapse:collapse;width:100%">
      <thead><tr style="background:#F3F4F6">
        <th align="left" style="border:1px solid #E5E7EB;padding:8px;font-size:13px">워크플로</th>
        <th style="border:1px solid #E5E7EB;padding:8px;font-size:13px">실패 횟수</th>
        <th align="left" style="border:1px solid #E5E7EB;padding:8px;font-size:13px">마지막 실패</th>
        <th align="left" style="border:1px solid #E5E7EB;padding:8px;font-size:13px">링크</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">매일 KST 09:00 자동 — workflow-failure-monitor.mjs<br>
    개별 워크플로 실패 메일이 폭주하는 대신, 24h 1통으로 통합. 실패 0건이면 발송 안 함.</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL 자동감사 <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨] 24h 워크플로 실패 ${failed.length}건 (${Object.keys(byName).length}종)`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
