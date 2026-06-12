#!/usr/bin/env node
/**
 * [STEP 2/F] 가짜 별점 소스 게이트 (venues.ts)
 *
 * 가짜 별점·후기는 JSON-LD(SSR)뿐 아니라 venue 데이터(클라이언트 렌더 ★)로도 들어온다.
 * dist-audit는 SSR HTML만 보므로 클라이언트 ★를 못 잡는다 → 소스 단계에서 차단.
 *
 * 규칙: 실제 검증된 후기(reviewCount>0)가 없으면 별점(rating)도 0이어야 한다.
 *   - rating>0 && reviewCount==0  → ERR (후기 0개인데 별점 존재 = 창작)
 *   - reviewCount>0 && rating==0  → ERR (후기 있는데 별점 0 = 불일치)
 * 실제 회원 후기는 DB(reviews 테이블)에서 집계되며, venues.ts의 rating/reviewCount는
 * 정적 시드값이므로 둘 다 0이 정상(=표시 안 함).
 *
 * 양방향 검증됨: 정상 PASS + 가짜 주입 시 FAIL.
 */
import fs from 'node:fs';

const SRC = 'src/data/venues.ts';
const src = fs.readFileSync(SRC, 'utf8');
const blocks = src.split(/\n  \{/);

const errors = [];
for (const block of blocks) {
  const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
  if (!slug) continue;
  const ratingM = block.match(/rating:\s*([\d.]+)/);
  const reviewM = block.match(/reviewCount:\s*([\d]+)/);
  if (!ratingM) continue;
  const rating = parseFloat(ratingM[1]);
  const reviewCount = reviewM ? parseInt(reviewM[1], 10) : 0;

  if (rating > 0 && reviewCount === 0) {
    errors.push(`${slug}: rating=${rating} 인데 reviewCount=0 → 검증된 후기 없는 별점(창작) 금지`);
  }
  if (reviewCount > 0 && rating === 0) {
    errors.push(`${slug}: reviewCount=${reviewCount} 인데 rating=0 → 후기↔별점 불일치`);
  }
}

if (errors.length) {
  console.error(`\n❌ [STEP 2/F] 가짜 별점 소스 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n실제 검증된 후기(reviewCount>0)가 없으면 rating은 0이어야 합니다. 별점 창작 금지.\n');
  process.exit(1);
}

console.log('✅ [STEP 2/F] 가짜 별점 소스 게이트 PASS — venues.ts 별점 창작 0건');
