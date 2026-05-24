/**
 * dist 빌드 직후 121업소 키워드 밀도 감사 (시즌67).
 * 임계: density > 3.0% → 회귀, exit 1.
 * 라이브 24h watch보다 빠른 빌드 직후 catch (CF Pages 배포 전).
 *
 * 실행: npm run audit:venue-density  (npm run build 이후)
 */
import { readFileSync, existsSync } from 'fs';

const THRESHOLD = 0.030;

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

const vfile = readFileSync('src/data/venues.ts', 'utf8');
const blocks = [...vfile.matchAll(/slug:\s*'([^']+)'[\s\S]*?nameKo:\s*'([^']+)'[\s\S]*?category:\s*'([^']+)'[\s\S]*?region:\s*'([^']+)'/g)];

// venue별 dist HTML 경로 후보 — 다양한 라우트 패턴 대응
function candidatePaths({ slug, category, region }) {
  const cat = category === 'club' ? 'clubs' : category === 'night' ? 'nights' : category === 'room' ? 'rooms' : category === 'yojeong' ? 'yojeong' : category === 'lounge' ? 'lounges' : category === 'hoppa' ? 'hoppa' : category;
  return [
    `dist/${cat}/${region}/${slug}/index.html`,
    `dist/${cat}/${slug}/index.html`,
  ];
}

const rows = [];
let regressions = 0;

for (const m of blocks) {
  const [, slug, nameKo, category, region] = m;
  let html = null;
  let path = null;
  for (const p of candidatePaths({ slug, category, region })) {
    if (existsSync(p)) { html = readFileSync(p, 'utf8'); path = p; break; }
  }
  if (!html) continue; // 페이지 미생성 venue 건너뛰기 (정상)

  const text = stripHtml(html);
  const kw = (text.match(new RegExp(nameKo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const density = (kw * nameKo.length) / text.length;

  if (density > THRESHOLD) {
    regressions++;
    rows.push({ slug, name: nameKo, len: text.length, kw, density: (density * 100).toFixed(2) + '%', path });
  }
}

console.log(`venue density audit — 임계 ${(THRESHOLD * 100).toFixed(1)}% / 검사 ${blocks.length}건`);

if (rows.length > 0) {
  console.log(`\n⚠ 회귀 ${rows.length}건`);
  console.table(rows);
  console.log('\nfix: description 본문 확장 또는 풀네임 등장 회수 축소');
  process.exit(1);
}

console.log('✅ 전 venue 키워드 밀도 정상 (≤3.0%)');
