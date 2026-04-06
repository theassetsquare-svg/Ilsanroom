/**
 * OG Image Generator — public/og/ 에 SVG 파일 생성
 * 실행: npx tsx scripts/generate-og-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import venues data
const venuesPath = path.resolve(__dirname, '../src/data/venues.ts');
const venuesContent = fs.readFileSync(venuesPath, 'utf-8');

// Parse venues from TS file
interface VenueInfo {
  slug: string;
  nameKo: string;
  category: string;
  staffNickname?: string;
}

const venues: VenueInfo[] = [];
const slugRegex = /slug:\s*'([^']+)'/g;
const nameRegex = /nameKo:\s*'([^']+)'/g;
const catRegex = /category:\s*'([^']+)'/g;
const staffRegex = /staffNickname:\s*'([^']+)'/g;

// Simple extraction: find all venue blocks
const blocks = venuesContent.split(/\n  \{/);
for (const block of blocks) {
  const slugMatch = block.match(/slug:\s*'([^']+)'/);
  const nameMatch = block.match(/nameKo:\s*'([^']+)'/);
  const catMatch = block.match(/category:\s*'([^']+)'/);
  const staffMatch = block.match(/staffNickname:\s*'([^']+)'/);
  if (slugMatch && nameMatch && catMatch) {
    venues.push({
      slug: slugMatch[1],
      nameKo: nameMatch[1],
      category: catMatch[1],
      staffNickname: staffMatch?.[1],
    });
  }
}

const categoryColors: Record<string, string> = {
  club: '#7C3AED',
  night: '#EC4899',
  lounge: '#D4AF37',
  room: '#1E3A5F',
  yojeong: '#059669',
  hoppa: '#DC2626',
};

const categoryLabels: Record<string, string> = {
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateSvg(title: string, subtitle: string, bg: string, staff?: string): string {
  const titleLen = title.length;
  const titleSize = staff
    ? (titleLen > 15 ? 52 : titleLen > 10 ? 60 : titleLen > 6 ? 72 : 80)
    : (titleLen > 15 ? 72 : titleLen > 10 ? 88 : titleLen > 6 ? 100 : 120);
  const titleY = staff ? 220 : 300;
  const staffName = staff?.replace('담당: ', '') || '';
  const staffSize = staffName.length > 4 ? 110 : 130;
  const staffLine = staff
    ? `<text x="600" y="${titleY + 130}" text-anchor="middle" font-family="sans-serif" font-size="${staffSize}" font-weight="900" fill="#FCD34D" letter-spacing="0.02em">${escapeXml(staffName)}</text>`
    : '';
  const subtitleY = staff ? titleY + 200 : titleY + 100;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${escapeXml(bg)};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="550" rx="32" fill="rgba(255,255,255,0.08)"/>
  <text x="600" y="${titleY}" text-anchor="middle" font-family="sans-serif" font-size="${titleSize}" font-weight="900" fill="white" letter-spacing="-0.02em">${escapeXml(title)}</text>
  ${staffLine}
  <text x="600" y="${subtitleY}" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="600" fill="rgba(255,255,255,0.85)">${escapeXml(subtitle)}</text>
  <text x="600" y="570" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="500" fill="rgba(255,255,255,0.5)">놀쿨 — nolcool.com</text>
</svg>`;
}

// Create output directory
const outDir = path.resolve(__dirname, '../public/og');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. Main page
fs.writeFileSync(path.join(outDir, 'main.svg'), generateSvg('놀쿨', '전국 클럽·나이트·라운지·룸·요정·호빠', '#8B5CF6'));

// 2. Category pages
for (const [cat, label] of Object.entries(categoryLabels)) {
  const color = categoryColors[cat] || '#8B5CF6';
  fs.writeFileSync(path.join(outDir, `${cat === 'club' ? 'clubs' : cat === 'night' ? 'nights' : cat === 'lounge' ? 'lounges' : cat === 'room' ? 'rooms' : cat}.svg`), generateSvg(`${label} 전체보기`, '놀쿨', color));
}

// 3. Each venue
for (const v of venues) {
  const color = categoryColors[v.category] || '#8B5CF6';
  const label = categoryLabels[v.category] || '';
  const staffText = v.staffNickname ? `담당: ${v.staffNickname}` : undefined;
  fs.writeFileSync(path.join(outDir, `${v.slug}.svg`), generateSvg(v.nameKo, `${label} | 놀쿨`, color, staffText));
}

// 4. Utility pages
const utilPages = [
  { file: 'guide', title: '첫 방문 가이드', bg: '#B45309' },
  { file: 'ranking', title: '인기 랭킹 TOP 20', bg: '#7C3AED' },
  { file: 'magazine', title: '매거진', bg: '#0891B2' },
  { file: 'community', title: '커뮤니티', bg: '#059669' },
  { file: 'quiz', title: '밤문화 MBTI', bg: '#EC4899' },
  { file: 'map', title: '지도', bg: '#1E3A5F' },
  { file: 'events', title: '이벤트', bg: '#D97706' },
  { file: 'pricing', title: '업주 요금제', bg: '#7C3AED' },
  { file: 'safety', title: '안전 도구', bg: '#DC2626' },
  { file: '404', title: '404', bg: '#555555' },
];
for (const p of utilPages) {
  fs.writeFileSync(path.join(outDir, `${p.file}.svg`), generateSvg(p.title, '놀쿨', p.bg));
}

console.log(`✅ Generated ${venues.length + 6 + utilPages.length + 1} OG images in public/og/`);
