/**
 * IndexNow 자동 색인 제출
 * - sitemap.xml에서 URL 추출
 * - IndexNow API로 Bing/Naver/Yandex에 제출
 *
 * 환경변수:
 *   INDEXNOW_KEY — IndexNow API 키 (nolcool.com 루트에 키 파일 배치 필요)
 *
 * 실행: INDEXNOW_KEY=xxx node scripts/indexnow.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SITE = 'nolcool.com';
const KEY = process.env.INDEXNOW_KEY;

if (!KEY) {
  console.log('⚠️  INDEXNOW_KEY 미설정 — 색인 제출 skip (24h cron 노이즈 회피)');
  console.log('   설정 방법: https://www.indexnow.org/ 에서 키 발급 후 GitHub secret INDEXNOW_KEY 등록');
  process.exit(0);
}

// sitemap.xml 또는 dist에서 URL 추출
function getUrls() {
  const urls = new Set();

  // 1. dist/sitemap.xml 파싱
  const sitemapPath = resolve('dist', 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    const content = readFileSync(sitemapPath, 'utf-8');
    const matches = content.matchAll(/<loc>(.*?)<\/loc>/g);
    for (const m of matches) {
      urls.add(m[1]);
    }
  }

  // 2. 기본 URL 추가 (sitemap 없을 때 폴백)
  if (urls.size === 0) {
    const paths = [
      '/', '/clubs', '/nights', '/lounges', '/rooms', '/yojeong', '/hoppa',
      '/community', '/guide', '/quiz', '/roulette', '/vs', '/ranking',
      '/magazine', '/lounge', '/search', '/venue-info',
    ];
    for (const p of paths) {
      urls.add(`https://${SITE}${p}`);
    }
  }

  return [...urls];
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

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      console.log(`${endpoint}: ${res.status} ${res.statusText}`);
    } catch (err) {
      console.error(`${endpoint}: ${err.message}`);
    }
  }
}

async function main() {
  const urls = getUrls();
  console.log(`IndexNow 제출: ${urls.length}개 URL`);

  if (urls.length === 0) {
    console.log('제출할 URL이 없습니다.');
    return;
  }

  // 처음 5개 미리보기
  urls.slice(0, 5).forEach(u => console.log(`  - ${u}`));
  if (urls.length > 5) console.log(`  ... 외 ${urls.length - 5}개`);

  await submitIndexNow(urls);
  console.log('IndexNow 제출 완료');
}

main().catch(console.error);
