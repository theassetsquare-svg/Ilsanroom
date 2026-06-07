#!/usr/bin/env node
/**
 * 놀쿨 카테고리 키워드 밀도 게이트 (★재발 방지 — 시즌91/6단계).
 *
 * 막는 것: 6 카테고리 페이지(/clubs /nights /rooms /lounges /yojeong /hoppa)의
 *   SSR 본문 키워드 밀도가 밴드를 벗어나는 회귀.
 *   - 천장 초과 = 키워드 스터핑(구글 템플릿/스팸 인식) → 색인 약화.
 *   - 바닥 미만 = 본문이 키워드를 거의 안 담음 → 카테고리 관련성 약함.
 *
 * 측정 로직은 categories-seo-audit.mjs(라이브 일일 watch)와 동일.
 *   라이브 watch는 배포 후 ~다음날 07:10에 잡지만, 이 게이트는 push/배포 전에
 *   막는다 → 회귀가 라이브에 못 닿는다(빌드게이트 본체).
 *
 * 1글자 키워드(룸)는 char-weighted density가 자연 절반 → 별도 밴드.
 *
 * dist/{slug}/index.html(prerender 결과)을 본다 → 빌드(prerender) 후 실행.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const CATS = [
  { slug: 'clubs',   kw: '클럽' },
  { slug: 'nights',  kw: '나이트' },
  { slug: 'rooms',   kw: '룸' },
  { slug: 'lounges', kw: '라운지' },
  { slug: 'yojeong', kw: '요정' },
  { slug: 'hoppa',   kw: '호빠' },
];

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }

// categories-seo-audit.mjs와 동일한 visible-text 추출 + density 공식
function density(html, kw) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const n = (text.match(new RegExp(kw, 'g')) || []).length;
  return { n, len: text.length, d: (n * kw.length) / text.length };
}

console.log('📐 카테고리 키워드 밀도 게이트');
const errors = [];
for (const { slug, kw } of CATS) {
  const p = join(DIST, slug, 'index.html');
  if (!existsSync(p)) { errors.push(`${slug}: dist/${slug}/index.html 없음`); continue; }
  const { n, len, d } = density(readFileSync(p, 'utf8'), kw);
  const short = kw.length === 1;
  const min = short ? 0.008 : 0.015;
  const max = short ? 0.020 : 0.030;
  const ok = d >= min && d <= max;
  const pct = (d * 100).toFixed(2);
  const band = `${(min * 100).toFixed(1)}~${(max * 100).toFixed(1)}%`;
  console.log(`   ${ok ? '✅' : '❌'} /${slug}/ kw="${kw}" 밀도 ${pct}% (${n}회/${len}자) 밴드 ${band}`);
  if (!ok) errors.push(`/${slug}/ 밀도 ${pct}% 밴드 ${band} 이탈 (${n}회/${len}자)`);
}

if (errors.length) {
  console.error(`\n❌ 카테고리 밀도 게이트 FAIL — ${errors.length}건`);
  errors.forEach(e => console.error(`   · ${e}`));
  process.exit(1);
}
console.log('✅ 카테고리 밀도 게이트 PASS — 6 카테고리 전부 밴드 정상');
