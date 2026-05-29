#!/usr/bin/env node
/**
 * 시즌176-B — CF Pages 배포 완료 동기화 가드
 *
 * 사용: workflow_dispatch / push trigger watch 시작 전 호출
 *   node scripts/lib/wait-for-deploy.mjs  ← workflow에서 step으로
 *   또는 ESM import { waitForDeploy } from './lib/wait-for-deploy.mjs'
 *
 * 동작: 라이브 https://nolcool.com/ 의 <meta name="build-sha"> 가
 *       GITHUB_SHA (또는 git HEAD) 와 일치할 때까지 최대 180초 폴링.
 *       일치하지 않아도 graceful 진행 (exit 0) — watch 실행은 한다.
 */

import https from 'https';
import { execSync } from 'child_process';

const TARGET_SHA = (process.env.GITHUB_SHA || (() => {
  try { return execSync('git rev-parse HEAD').toString().trim(); }
  catch { return ''; }
})()).slice(0, 12);

const MAX_WAIT_MS = 180_000;
const POLL_MS = 6_000;
const URL = 'https://nolcool.com/';

function fetchSha() {
  return new Promise((res) => {
    const t = setTimeout(() => res(null), 8000);
    https.get(URL, { headers: { 'User-Agent': 'NolcoolDeploySync/1.0', 'Cache-Control': 'no-cache' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        clearTimeout(t);
        const html = Buffer.concat(chunks).toString('utf8');
        const m = html.match(/<meta name="build-sha" content="([^"]+)"/);
        res(m ? m[1] : null);
      });
    }).on('error', () => { clearTimeout(t); res(null); });
  });
}

export async function waitForDeploy() {
  if (!TARGET_SHA) {
    console.log('⏭️  deploy-sync: GITHUB_SHA 없음 — skip');
    return;
  }
  const start = Date.now();
  let attempts = 0;
  while (Date.now() - start < MAX_WAIT_MS) {
    attempts++;
    const liveSha = await fetchSha();
    if (liveSha === TARGET_SHA) {
      console.log(`✓ deploy-sync: 라이브 sha=${liveSha} 일치 (${attempts}회, ${Math.round((Date.now()-start)/1000)}s)`);
      return;
    }
    if (attempts === 1) console.log(`⏳ deploy-sync: target=${TARGET_SHA} / live=${liveSha || 'none'} — CF 배포 대기`);
    await new Promise(r => setTimeout(r, POLL_MS));
  }
  console.log(`⚠️  deploy-sync: 180s 타임아웃 (live=${await fetchSha() || 'none'}) — graceful 진행`);
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  await waitForDeploy();
}
