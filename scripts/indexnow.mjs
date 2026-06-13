/**
 * IndexNow 자동 색인 제출 — ★변경분만 (정직화)
 * - dist/sitemap.xml에서 <loc>+<lastmod> 쌍 추출
 * - 직전 제출 스냅샷(scripts/.indexnow-last.json)과 비교 → 신규·lastmod 바뀐 URL만 POST
 * - 변경 0이면 그날 제출 스킵 (할 일 없으면 침묵, cron 노이즈 0)
 * - sitemap의 lastmod는 prerender-seo.mjs가 실제 콘텐츠 해시 변경 시에만 today로 갱신(정직)
 *
 * 환경변수:
 *   INDEXNOW_KEY — IndexNow API 키 (nolcool.com 루트에 키 파일 배치 필요)
 *
 * 실행: INDEXNOW_KEY=xxx node scripts/indexnow.mjs
 * 스냅샷은 GitHub Actions actions/cache로 워크플로 실행 간 영속 (repo 커밋 X)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SITE = 'nolcool.com';
const KEY = process.env.INDEXNOW_KEY;
const SNAPSHOT_PATH = resolve('scripts', '.indexnow-last.json');

// dist/sitemap.xml에서 {url: lastmod} 추출 (<url> 블록 단위로 loc·lastmod 페어링)
function readSitemap() {
  const map = {};
  const sitemapPath = resolve('dist', 'sitemap.xml');
  if (!existsSync(sitemapPath)) return map;
  const content = readFileSync(sitemapPath, 'utf-8');
  const blocks = content.matchAll(/<url>([\s\S]*?)<\/url>/g);
  for (const b of blocks) {
    const loc = b[1].match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = b[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1] || '';
    map[loc] = lastmod;
  }
  return map;
}

function readSnapshot() {
  try { return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8')); }
  catch { return {}; }
}

// 신규 URL + lastmod가 직전 제출 이후 바뀐 URL만
function diffChanged(current, prev) {
  const changed = [];
  for (const [url, lm] of Object.entries(current)) {
    if (prev[url] !== lm) changed.push(url);
  }
  return changed;
}

async function submitIndexNow(urls) {
  const payload = {
    host: SITE,
    key: KEY,
    keyLocation: `https://${SITE}/${KEY}.txt`,
    urlList: urls.slice(0, 10000), // IndexNow 최대 10,000개
  };
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ];
  let ok = false;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      console.log(`${endpoint}: ${res.status} ${res.statusText}`);
      if (res.ok) ok = true;
    } catch (err) {
      console.error(`${endpoint}: ${err.message}`);
    }
  }
  return ok;
}

async function main() {
  const current = readSitemap();
  const total = Object.keys(current).length;
  if (total === 0) {
    console.log('⚠️  sitemap.xml에서 URL을 찾지 못함 — skip');
    return;
  }

  const prev = readSnapshot();
  const firstRun = Object.keys(prev).length === 0;
  const changed = diffChanged(current, prev);

  console.log(`📊 sitemap ${total}개 · 직전 스냅샷 ${Object.keys(prev).length}개 · 변경/신규 ${changed.length}개${firstRun ? ' (최초 실행 — 전량이 신규)' : ''}`);

  // 변경 0 → 제출 스킵 (스냅샷도 동일하므로 그대로). 침묵.
  if (changed.length === 0) {
    console.log('✅ 변경 없음 — IndexNow 제출 스킵 (구글 권장: 변경 시에만 재크롤)');
    return;
  }

  changed.slice(0, 8).forEach(u => console.log(`  + ${u}`));
  if (changed.length > 8) console.log(`  ... 외 ${changed.length - 8}개`);

  if (!KEY) {
    // 로컬/키 없는 환경: diff만 계산·출력하고 제출 안 함. 스냅샷도 advance 안 함(다음 키 있는 실행이 제출).
    console.log('⚠️  INDEXNOW_KEY 미설정 — 변경분 계산만 (제출·스냅샷 갱신 skip)');
    console.log('   설정: https://www.indexnow.org/ 키 발급 후 GitHub secret INDEXNOW_KEY 등록');
    return;
  }

  const ok = await submitIndexNow(changed);
  if (ok) {
    // 제출 성공한 것만 "제출 완료" 상태로 스냅샷 갱신 → 다음 실행이 그 이후 변경분만 잡음
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(current, null, 0) + '\n');
    console.log(`✅ IndexNow 제출 완료 (${changed.length}개) · 스냅샷 갱신`);
  } else {
    console.log('⚠️  모든 엔드포인트 실패 — 스냅샷 미갱신 (다음 실행 재시도)');
  }
}

main().catch(console.error);
