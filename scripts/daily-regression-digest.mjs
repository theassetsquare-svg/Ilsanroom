#!/usr/bin/env node
/**
 * 시즌176-C — 일일 회귀 다이제스트 (KST 09:00)
 *
 * GitHub Actions API → 최근 24h 워크플로 실행 집계 → Resend 1통
 * 정상이든 회귀든 매일 1통 (Gmail 인박스가 회귀 대시보드)
 *
 * 환경변수 (GitHub Secrets):
 *   GITHUB_TOKEN          - Actions runs API 호출용 (default 토큰 자동)
 *   GH_REPO               - "theassetsquare-svg/Ilsanroom"
 *   RESEND_API_KEY        - 이메일 발송
 *   NOTIFICATION_EMAIL    - 수신자
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const REPO = process.env.GH_REPO || 'theassetsquare-svg/Ilsanroom';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const JSON_OUT = 'public/admin/actions-digest.json';

if (!TOKEN) {
  console.log('⏭️  GITHUB_TOKEN 없음 — skip');
  process.exit(0);
}

const since = Date.now() - 24 * 3600 * 1000;
const kst = (d) => new Date(new Date(d).getTime() + 9*3600e3).toISOString().slice(5,16).replace('T',' ');
const kstNow = new Date(Date.now() + 9*3600e3).toISOString().replace('T',' ').slice(0,16) + ' KST';

async function fetchRuns() {
  const all = [];
  for (let page = 1; page <= 4; page++) {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' }
    });
    if (!r.ok) { console.warn(`GitHub API ${r.status}`); break; }
    const data = await r.json();
    const runs = data.workflow_runs || [];
    all.push(...runs);
    if (runs.length < 100) break;
    if (new Date(runs[runs.length-1].created_at).getTime() < since) break;
  }
  return all.filter(r => new Date(r.created_at).getTime() >= since);
}

// 시즌176 후속-1 — deploy-sync 실측: 최근 24h "Wait for CF Pages deploy" step 시간 분포
async function measureDeploySync(runs) {
  const samples = [];
  const candidates = runs
    .filter(r => r.event !== 'schedule' && r.conclusion === 'success')
    .slice(0, 30); // 토큰/API 절약 위해 최대 30개
  for (const run of candidates) {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${run.id}/jobs`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      if (!r.ok) continue;
      const data = await r.json();
      for (const job of data.jobs || []) {
        const step = (job.steps || []).find(s => s.name === 'Wait for CF Pages deploy');
        if (step && step.started_at && step.completed_at) {
          const ms = new Date(step.completed_at) - new Date(step.started_at);
          samples.push({ ms, workflow: run.name, url: run.html_url });
        }
      }
    } catch {}
  }
  if (samples.length === 0) return null;
  const sorted = samples.map(s => s.ms).sort((a,b) => a-b);
  const p = (q) => sorted[Math.min(sorted.length-1, Math.floor(sorted.length * q))];
  return {
    n: samples.length,
    avg_ms: Math.round(sorted.reduce((a,b) => a+b, 0) / sorted.length),
    p50_ms: p(0.5),
    p95_ms: p(0.95),
    max_ms: sorted[sorted.length-1],
    max_sample: samples.find(s => s.ms === sorted[sorted.length-1]),
  };
}

function aggregate(runs) {
  const byName = {};
  for (const r of runs) {
    byName[r.name] ??= { total: 0, success: 0, failure: 0, in_progress: 0, last_fail: null };
    const b = byName[r.name];
    b.total++;
    if (r.conclusion === 'success') b.success++;
    else if (r.conclusion === 'failure') {
      b.failure++;
      if (!b.last_fail || new Date(r.created_at) > new Date(b.last_fail.created_at)) {
        b.last_fail = { created_at: r.created_at, url: r.html_url };
      }
    }
    else if (r.status === 'in_progress' || r.status === 'queued') b.in_progress++;
  }
  return byName;
}

function buildHtml(byName, deploySync) {
  const entries = Object.entries(byName).sort(([,a],[,b]) => b.failure - a.failure || b.total - a.total);
  const totalFail = entries.reduce((s, [,b]) => s + b.failure, 0);
  const totalRuns = entries.reduce((s, [,b]) => s + b.total, 0);

  const headerColor = totalFail === 0 ? '#16A34A' : '#DC2626';
  const headerEmoji = totalFail === 0 ? '✅' : '🚨';
  const headerText = totalFail === 0 ? `회귀 0건 / ${entries.length} 워크플로 / ${totalRuns} 실행` : `회귀 ${totalFail}건 / ${entries.length} 워크플로 / ${totalRuns} 실행`;

  const deployBlock = deploySync ? `
    <div style="background:white;padding:14px 20px;border:1px solid #E5E7EB;border-top:0">
      <h3 style="margin:0 0 8px;font-size:13px;color:#374151">⏱️ Deploy-sync 실측 (24h, n=${deploySync.n})</h3>
      <div style="font-size:12px;color:#6B7280;display:flex;gap:16px">
        <span>avg <strong style="color:#111">${(deploySync.avg_ms/1000).toFixed(1)}s</strong></span>
        <span>p50 <strong>${(deploySync.p50_ms/1000).toFixed(1)}s</strong></span>
        <span>p95 <strong>${(deploySync.p95_ms/1000).toFixed(1)}s</strong></span>
        <span>max <strong style="color:#DC2626">${(deploySync.max_ms/1000).toFixed(1)}s</strong></span>
      </div>
    </div>` : '';

  const rows = entries.map(([name, b]) => {
    const failBadge = b.failure > 0
      ? `<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${b.failure} fail</span>`
      : `<span style="background:#DCFCE7;color:#166534;padding:2px 8px;border-radius:4px;font-size:12px">0 fail</span>`;
    const lastFail = b.last_fail
      ? `<a href="${b.last_fail.url}" style="color:#DC2626;font-size:12px">${kst(b.last_fail.created_at)} ↗</a>`
      : '<span style="color:#9CA3AF;font-size:12px">—</span>';
    return `<tr style="border-bottom:1px solid #E5E7EB">
      <td style="padding:8px 4px;font-size:13px">${name}</td>
      <td style="padding:8px 4px;text-align:right;font-size:12px;color:#6B7280">${b.success}/${b.total}</td>
      <td style="padding:8px 4px;text-align:right">${failBadge}</td>
      <td style="padding:8px 4px;text-align:right">${lastFail}</td>
    </tr>`;
  }).join('');

  return `<div style="font-family:-apple-system,sans-serif;max-width:720px;margin:0 auto;padding:20px;background:#FAFAFA">
    <div style="background:${headerColor};color:white;padding:16px 20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0;font-size:18px">${headerEmoji} 놀쿨 24h 회귀 다이제스트</h2>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.9">${headerText}</p>
    </div>
    ${deployBlock}
    <div style="background:white;padding:0;border:1px solid #E5E7EB;border-top:0;border-radius:0 0 8px 8px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#F9FAFB;border-bottom:2px solid #E5E7EB">
          <th style="padding:10px 4px;text-align:left;font-size:12px;color:#6B7280;text-transform:uppercase">워크플로</th>
          <th style="padding:10px 4px;text-align:right;font-size:12px;color:#6B7280">성공/총</th>
          <th style="padding:10px 4px;text-align:right;font-size:12px;color:#6B7280">회귀</th>
          <th style="padding:10px 4px;text-align:right;font-size:12px;color:#6B7280">마지막 실패</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p style="color:#9CA3AF;font-size:11px;margin-top:16px;text-align:center">측정: ${kstNow} · 범위: 최근 24h · Actions API · 시즌176-C</p>
  </div>`;
}

async function sendMail(subject, html) {
  if (!RESEND_API_KEY) { console.log('⏭️  RESEND_API_KEY 없음 — skip 메일'); return; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject,
      html,
    }),
  });
  console.log(`메일 ${r.status} → ${TO}`);
}

const runs = await fetchRuns();
const byName = aggregate(runs);
const deploySync = await measureDeploySync(runs);
const totalFail = Object.values(byName).reduce((s, b) => s + b.failure, 0);
const subject = totalFail === 0
  ? `[놀쿨][✅] 24h 회귀 0건 — ${Object.keys(byName).length} 워크플로 OK`
  : `[놀쿨][🚨] 24h 회귀 ${totalFail}건 — Actions 확인 필요`;
console.log(`${runs.length} runs / ${Object.keys(byName).length} workflows / ${totalFail} fail`);
if (deploySync) console.log(`deploy-sync: n=${deploySync.n} avg=${deploySync.avg_ms}ms p95=${deploySync.p95_ms}ms max=${deploySync.max_ms}ms`);

// 시즌176 후속-3 — /admin/audit Actions 24h 카드용 JSON snapshot
// (워크플로가 변경분만 commit → CF Pages 자동 배포 → AuditReportPage가 same-origin fetch)
const snapshot = {
  generated_at: new Date().toISOString(),
  window_hours: 24,
  total_runs: runs.length,
  total_fail: totalFail,
  workflows: Object.entries(byName)
    .sort(([,a],[,b]) => b.failure - a.failure || b.total - a.total)
    .map(([name, b]) => ({
      name,
      total: b.total,
      success: b.success,
      failure: b.failure,
      in_progress: b.in_progress,
      last_fail: b.last_fail,
    })),
  deploy_sync: deploySync,
};
mkdirSync(dirname(JSON_OUT), { recursive: true });
writeFileSync(JSON_OUT, JSON.stringify(snapshot, null, 2));
console.log(`snapshot → ${JSON_OUT}`);

await sendMail(subject, buildHtml(byName, deploySync));
