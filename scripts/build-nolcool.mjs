#!/usr/bin/env node
/**
 * 놀쿨 서브사이트 정적 HTML 생성기
 * - venues.ts 데이터 파싱 → 정적 HTML 페이지 출력
 * - 6종 카테고리 + 개별 업소 상세페이지
 * - SEO 최적화, 80% 정보 / 20% CTA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'nolcool-dist');
const MAIN_SITE = 'https://ilsanroom.pages.dev';

// ── 카테고리 매핑 ──
const CATEGORIES = [
  { key: 'club', labelKo: '클럽', path: 'clubs', icon: '🎵', color: '#7c3aed', desc: '전국 클럽 정보 — EDM, 힙합, 테크노 등 다양한 장르의 클럽을 한눈에. 분위기, 위치, 특징까지 꼼꼼하게 정리했습니다.' },
  { key: 'night', labelKo: '나이트', path: 'nights', icon: '🌙', color: '#3b82f6', desc: '전국 나이트 정보 — 소셜 댄스, 라이브 밴드, 격 있는 사교의 밤. 지역별 나이트 특징과 분위기를 비교해보세요.' },
  { key: 'lounge', labelKo: '라운지', path: 'lounges', icon: '🍸', color: '#f59e0b', desc: '격 있는 라운지 정보 — 프라이빗한 공간에서 즐기는 품격 있는 시간. 라운지별 콘셉트와 분위기를 확인하세요.' },
  { key: 'room', labelKo: '룸', path: 'rooms', icon: '🚪', color: '#f43f5e', desc: '프라이빗 룸 정보 — 비즈니스 미팅부터 소규모 모임까지. 룸 규모, 서비스, 접근성을 꼼꼼히 비교합니다.' },
  { key: 'yojeong', labelKo: '요정', path: 'yojeong', icon: '🏮', color: '#10b981', desc: '전통 요정 정보 — 한정식과 국악이 어우러지는 품격 있는 공간. 접대와 기념일에 적합한 요정을 소개합니다.' },
  { key: 'hoppa', labelKo: '호빠', path: 'hoppa', icon: '🥂', color: '#ec4899', desc: '호스트바 정보 — 전국 호빠의 분위기, 시스템, 위치 정보를 정리했습니다. 첫 방문도 걱정 없도록 안내합니다.' },
];

// ── venues.ts 파싱 ──
function parseVenues() {
  const raw = fs.readFileSync(path.join(ROOT, 'src/data/venues.ts'), 'utf-8');

  // 배열 부분 추출
  const arrMatch = raw.match(/export\s+const\s+venues:\s*Venue\[\]\s*=\s*\[([\s\S]*)\];/);
  if (!arrMatch) throw new Error('venues 배열을 찾을 수 없습니다.');

  const venues = [];
  // 각 객체 블록 추출
  const objRegex = /\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  let m;
  while ((m = objRegex.exec(arrMatch[1])) !== null) {
    const block = m[1];
    const get = (key) => {
      const r = new RegExp(`${key}:\\s*['"\`]([\\s\\S]*?)['"\`]`);
      const match = block.match(r);
      return match ? match[1].replace(/\\'/g, "'") : '';
    };
    const getArr = (key) => {
      const r = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`);
      const match = block.match(r);
      if (!match) return [];
      return match[1].match(/['"]([^'"]*)['"]/g)?.map(s => s.replace(/['"]/g, '')) || [];
    };

    const slug = get('slug');
    const category = get('category');
    const status = get('status');
    if (!slug || !category) continue;
    if (status === 'closed_or_unclear') continue;

    venues.push({
      slug,
      name: get('name'),
      nameKo: get('nameKo'),
      category,
      region: get('region'),
      regionKo: get('regionKo'),
      description: get('description'),
      shortDescription: get('shortDescription'),
      features: getArr('features'),
      tags: getArr('tags'),
      district: get('district'),
      staffNickname: get('staffNickname'),
    });
  }

  return venues;
}

// ── HTML 템플릿 유틸 ──
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function metaDesc(text) {
  // 150자 이내
  if (text.length <= 150) return text;
  return text.slice(0, 147) + '...';
}

// 카테고리별 대표 이미지 (Unsplash placeholder → 교체 가능)
const categoryImages = {
  club: [
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=500&fit=crop',
  ],
  night: [
    'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop',
  ],
  lounge: [
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=500&fit=crop',
  ],
  room: [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop',
  ],
  yojeong: [
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?w=800&h=500&fit=crop',
  ],
  hoppa: [
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1575444758702-4a6b9222c016?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=500&fit=crop',
  ],
};

// ── CSS ──
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:'Pretendard',system-ui,-apple-system,sans-serif;background:#F9FAFB;color:#111;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{max-width:100%;height:auto;display:block}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
/* Header */
.site-header{background:#fff;border-bottom:1px solid #E5E7EB;position:sticky;top:0;z-index:50}
.site-header .wrap{display:flex;align-items:center;justify-content:space-between;height:56px}
.logo{font-size:1.35rem;font-weight:900;color:#7C3AED;letter-spacing:-.02em}
.logo span{color:#111}
.nav-cats{display:flex;gap:6px;flex-wrap:wrap}
.nav-cats a{font-size:.8rem;padding:4px 10px;border-radius:20px;background:#F3F4F6;color:#374151;transition:all .15s}
.nav-cats a:hover,.nav-cats a.active{background:#7C3AED;color:#fff}
/* Hero */
.hero-img{width:100%;aspect-ratio:1/1;max-width:400px;margin:32px auto 0;border-radius:16px;object-fit:cover;box-shadow:0 4px 24px rgba(0,0,0,.08)}
/* Content */
.article{background:#fff;border-radius:16px;padding:32px 28px;margin:24px 0;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.article h1{font-size:1.6rem;font-weight:800;margin-bottom:4px;line-height:1.3}
.article .region-badge{display:inline-block;font-size:.75rem;padding:3px 10px;border-radius:12px;background:#EDE9FE;color:#6D28D9;font-weight:600;margin-bottom:16px}
.article .desc{font-size:.95rem;color:#222;line-height:1.85;margin-bottom:24px;word-break:keep-all}
.article .features{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.article .features li{font-size:.8rem;padding:5px 14px;border-radius:20px;background:#F0FDF4;color:#059669;font-weight:500}
/* Body images */
.body-imgs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px}
.body-imgs img{border-radius:12px;width:100%;aspect-ratio:16/10;object-fit:cover}
@media(max-width:480px){.body-imgs{grid-template-columns:1fr}}
/* Info table */
.info-table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:.88rem}
.info-table th{text-align:left;padding:10px 12px;background:#F9FAFB;color:#6B7280;font-weight:600;width:30%;border-bottom:1px solid #F3F4F6}
.info-table td{padding:10px 12px;border-bottom:1px solid #F3F4F6;color:#111}
/* CTA */
.cta-box{background:linear-gradient(135deg,#7C3AED,#6D28D9);border-radius:16px;padding:28px 24px;text-align:center;margin:32px 0}
.cta-box p{color:rgba(255,255,255,.85);font-size:.92rem;margin-bottom:14px;line-height:1.6}
.cta-box .btn{display:inline-block;background:#fff;color:#7C3AED;font-weight:700;font-size:1rem;padding:14px 36px;border-radius:12px;transition:transform .15s,box-shadow .15s}
.cta-box .btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.15)}
/* Category listing */
.venue-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin:24px 0}
.venue-card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);transition:transform .15s,box-shadow .15s}
.venue-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)}
.venue-card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.venue-card .card-body{padding:16px 18px}
.venue-card .card-body h3{font-size:1.05rem;font-weight:700;margin-bottom:4px}
.venue-card .card-body .card-region{font-size:.78rem;color:#6D28D9;font-weight:600;margin-bottom:6px}
.venue-card .card-body p{font-size:.83rem;color:#555;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
/* Index hero */
.index-hero{text-align:center;padding:48px 20px 32px}
.index-hero h1{font-size:2rem;font-weight:900;margin-bottom:8px}
.index-hero p{font-size:1rem;color:#555;max-width:520px;margin:0 auto}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;margin:32px 0}
.cat-card{background:#fff;border-radius:14px;padding:24px 16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);transition:transform .15s}
.cat-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.cat-card .cat-icon{font-size:2.2rem;margin-bottom:8px}
.cat-card .cat-label{font-size:1rem;font-weight:700;color:#111}
.cat-card .cat-count{font-size:.78rem;color:#7C3AED;font-weight:600;margin-top:4px}
/* Category header */
.cat-header{padding:40px 0 20px;text-align:center}
.cat-header h1{font-size:1.8rem;font-weight:900;margin-bottom:8px}
.cat-header p{font-size:.92rem;color:#555;max-width:520px;margin:0 auto;line-height:1.7}
/* Footer */
.site-footer{background:#fff;border-top:1px solid #E5E7EB;margin-top:48px;padding:32px 20px}
.footer-cta{text-align:center;margin-bottom:20px}
.footer-cta .kakao{display:inline-block;background:#7C3AED;color:#fff;font-weight:700;font-size:.95rem;padding:10px 28px;border-radius:10px;margin-bottom:10px}
.footer-search{font-size:.88rem;color:#555;text-align:center;margin-bottom:16px}
.footer-search b{color:#7C3AED}
.footer-copy{text-align:center;font-size:.75rem;color:#9CA3AF}
/* Breadcrumb */
.breadcrumb{font-size:.78rem;color:#9CA3AF;padding:12px 0;display:flex;gap:4px;flex-wrap:wrap}
.breadcrumb a{color:#7C3AED}
/* Responsive */
@media(max-width:640px){
  .nav-cats{display:none}
  .article{padding:24px 18px}
  .article h1{font-size:1.3rem}
  .index-hero h1{font-size:1.5rem}
  .cat-grid{grid-template-columns:repeat(2,1fr)}
}
`;

// ── 공통 레이아웃 ──
function htmlShell({ title, ogTitle, description, canonical, body, jsonLd }) {
  const desc = metaDesc(description);
  const og = ogTitle || title;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="놀쿨">
<meta property="og:title" content="${escHtml(og)}">
<meta property="og:description" content="${escHtml(desc)}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<meta name="robots" content="index,follow">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preload" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.subset.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Bold.subset.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:'Pretendard';font-weight:400;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.subset.woff2') format('woff2')}
@font-face{font-family:'Pretendard';font-weight:600;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-SemiBold.subset.woff2') format('woff2')}
@font-face{font-family:'Pretendard';font-weight:700;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Bold.subset.woff2') format('woff2')}
@font-face{font-family:'Pretendard';font-weight:800;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-ExtraBold.subset.woff2') format('woff2')}
${CSS}
</style>
</head>
<body>
${headerHtml()}
${body}
${footerHtml()}
</body>
</html>`;
}

function headerHtml() {
  return `<header class="site-header">
<div class="wrap">
  <a href="/index.html" class="logo">놀<span>쿨</span></a>
  <nav class="nav-cats">
    ${CATEGORIES.map(c => `<a href="/${c.path}/index.html">${c.labelKo}</a>`).join('')}
  </nav>
</div>
</header>`;
}

function footerHtml() {
  return `<footer class="site-footer">
<div class="wrap">
  <div class="footer-cta">
    <div class="kakao">광고문의 카톡 besta12</div>
  </div>
  <p class="footer-search">구글 · ChatGPT · Gemini에서 <b>"놀쿨"</b> 검색하세요</p>
  <p class="footer-copy">&copy; 2025 놀쿨 — 전국 밤문화 정보</p>
</div>
</footer>`;
}

// ── description을 단락 분할 ──
function splitParagraphs(desc) {
  // 4~5문장 단위로 끊기
  const sentences = desc.split(/(?<=[다라다요것어][\.\─\!])\s*/);
  const paras = [];
  let buf = [];
  for (const s of sentences) {
    buf.push(s);
    if (buf.length >= 4) {
      paras.push(buf.join(' '));
      buf = [];
    }
  }
  if (buf.length) paras.push(buf.join(' '));
  return paras;
}

// ── 업소 상세 페이지 생성 ──
function buildVenuePage(venue) {
  const cat = CATEGORIES.find(c => c.key === venue.category);
  if (!cat) return null;

  const imgs = categoryImages[venue.category] || categoryImages.club;
  const heroImg = imgs[0];
  const bodyImgs = imgs.slice(1);

  const paras = splitParagraphs(venue.description);
  const parasHtml = paras.map(p => `<p class="desc">${escHtml(p)}</p>`).join('\n');

  const featuresHtml = venue.features.length
    ? `<ul class="features">${venue.features.map(f => `<li>${escHtml(f)}</li>`).join('')}</ul>`
    : '';

  const infoRows = [];
  if (venue.regionKo) infoRows.push(['지역', venue.regionKo]);
  if (venue.district) infoRows.push(['상세 위치', venue.district]);
  if (venue.staffNickname) infoRows.push(['담당', venue.staffNickname]);
  if (cat) infoRows.push(['카테고리', `${cat.icon} ${cat.labelKo}`]);
  if (venue.tags.length) infoRows.push(['키워드', venue.tags.join(', ')]);

  const infoHtml = infoRows.length
    ? `<table class="info-table"><tbody>${infoRows.map(([k, v]) => `<tr><th>${escHtml(k)}</th><td>${escHtml(v)}</td></tr>`).join('')}</tbody></table>`
    : '';

  // 메인사이트 링크 경로
  const mainLink = `${MAIN_SITE}/${cat.path}/${venue.slug}`;

  const body = `
<div class="wrap">
  <div class="breadcrumb">
    <a href="/index.html">놀쿨</a> &rsaquo;
    <a href="/${cat.path}/index.html">${cat.labelKo}</a> &rsaquo;
    <span>${escHtml(venue.nameKo)}</span>
  </div>
  <img class="hero-img" src="${heroImg}" alt="${escHtml(venue.nameKo)} 대표 이미지" width="600" height="600" loading="eager">
  <article class="article">
    <h1>${escHtml(venue.nameKo)}</h1>
    <span class="region-badge">${escHtml(venue.regionKo || '')} ${cat.labelKo}</span>

    ${parasHtml}

    ${featuresHtml}

    <div class="body-imgs">
      ${bodyImgs.map((src, i) => `<img src="${src}" alt="${escHtml(venue.nameKo)} 내부 사진 ${i + 1}" width="400" height="250" loading="lazy">`).join('\n      ')}
    </div>

    ${infoHtml}
  </article>

  <div class="cta-box">
    <p>${escHtml(venue.nameKo)}의 최신 정보, 예약 안내, 이벤트 소식까지<br>놀쿨에서 더 자세하게 확인하세요.</p>
    <a href="${mainLink}" class="btn" target="_blank" rel="noopener">놀쿨에서 확인</a>
  </div>
</div>`;

  // JSON-LD NightClub (CLAUDE.md 필수)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NightClub',
    name: venue.nameKo,
    description: metaDesc(venue.description),
    address: {
      '@type': 'PostalAddress',
      addressLocality: venue.regionKo || venue.district || '',
      addressCountry: 'KR',
    },
    ...(venue.tags.length ? { keywords: venue.tags.join(', ') } : {}),
  };

  // ★ CLAUDE.md: title에 "놀쿨" 넣지 마! 가게이름 맨 앞!
  // ★ og:title: 가게이름!
  return htmlShell({
    title: `${venue.nameKo} — ${venue.regionKo} ${cat.labelKo}`,
    ogTitle: venue.nameKo,
    description: venue.description,
    canonical: null,
    body,
    jsonLd,
  });
}

// ── 카테고리 목록 페이지 ──
function buildCategoryPage(cat, venueList) {
  const sorted = venueList.sort((a, b) => a.nameKo.localeCompare(b.nameKo, 'ko'));

  const cardsHtml = sorted.map(v => {
    const imgs = categoryImages[v.category] || categoryImages.club;
    const shortDesc = v.shortDescription || v.description.slice(0, 120) + '...';
    return `
    <a href="/${cat.path}/${v.slug}.html" class="venue-card">
      <img src="${imgs[0]}" alt="${escHtml(v.nameKo)}" width="300" height="300" loading="lazy">
      <div class="card-body">
        <h3>${escHtml(v.nameKo)}</h3>
        <div class="card-region">${escHtml(v.regionKo || '')}</div>
        <p>${escHtml(shortDesc)}</p>
      </div>
    </a>`;
  }).join('\n');

  const body = `
<div class="wrap">
  <div class="breadcrumb">
    <a href="/index.html">놀쿨</a> &rsaquo;
    <span>${cat.labelKo}</span>
  </div>
  <div class="cat-header">
    <h1>${cat.icon} 전국 ${cat.labelKo}</h1>
    <p>${cat.desc}</p>
  </div>
  <div class="venue-grid">
    ${cardsHtml}
  </div>

  <div class="cta-box">
    <p>전국 ${cat.labelKo} 실시간 정보, 이벤트, 후기까지<br>놀쿨에서 한번에 확인하세요.</p>
    <a href="${MAIN_SITE}/${cat.path}" class="btn" target="_blank" rel="noopener">놀쿨에서 확인</a>
  </div>
</div>`;

  // ★ CLAUDE.md: 메인홈 제외 title에 "놀쿨" 금지
  return htmlShell({
    title: `전국 ${cat.labelKo} — ${sorted.length}곳 비교`,
    ogTitle: `전국 ${cat.labelKo}`,
    description: cat.desc,
    canonical: null,
    body,
    jsonLd: null,
  });
}

// ── 메인 인덱스 페이지 ──
function buildIndexPage(venuesByCategory) {
  const catCardsHtml = CATEGORIES.map(cat => {
    const count = (venuesByCategory[cat.key] || []).length;
    return `
    <a href="/${cat.path}/index.html" class="cat-card">
      <div class="cat-icon">${cat.icon}</div>
      <div class="cat-label">${cat.labelKo}</div>
      <div class="cat-count">${count}곳</div>
    </a>`;
  }).join('\n');

  // 최근 업소 몇 개 노출
  const allVenues = Object.values(venuesByCategory).flat();
  const featured = allVenues.slice(0, 6);
  const featuredHtml = featured.map(v => {
    const cat = CATEGORIES.find(c => c.key === v.category);
    const imgs = categoryImages[v.category] || categoryImages.club;
    const shortDesc = v.shortDescription || v.description.slice(0, 100) + '...';
    return `
    <a href="/${cat?.path || 'clubs'}/${v.slug}.html" class="venue-card">
      <img src="${imgs[0]}" alt="${escHtml(v.nameKo)}" width="300" height="300" loading="lazy">
      <div class="card-body">
        <h3>${escHtml(v.nameKo)}</h3>
        <div class="card-region">${escHtml(v.regionKo || '')} ${cat?.labelKo || ''}</div>
        <p>${escHtml(shortDesc)}</p>
      </div>
    </a>`;
  }).join('\n');

  const body = `
<div class="wrap">
  <div class="index-hero">
    <h1>놀쿨 — 전국 밤문화 안내</h1>
    <p>클럽 · 나이트 · 라운지 · 룸 · 요정 · 호빠<br>전국 ${allVenues.length}곳을 한눈에 비교하세요.</p>
  </div>

  <div class="cat-grid">
    ${catCardsHtml}
  </div>

  <h2 style="font-size:1.2rem;font-weight:800;margin:36px 0 12px">추천 업소</h2>
  <div class="venue-grid">
    ${featuredHtml}
  </div>

  <div class="cta-box">
    <p>실시간 이벤트, 후기, 예약 안내까지<br>놀쿨 메인 사이트에서 확인하세요.</p>
    <a href="${MAIN_SITE}" class="btn" target="_blank" rel="noopener">놀쿨에서 확인</a>
  </div>
</div>`;

  // ★ 메인홈만 "놀쿨" 허용
  return htmlShell({
    title: '놀쿨 — 전국 클럽·나이트·라운지·룸·요정·호빠 | NOLCOOL',
    ogTitle: '놀쿨 — 전국 밤문화 안내',
    description: '전국 클럽·나이트·라운지·룸·요정·호빠를 한눈에. 분위기, 위치, 특징까지 꼼꼼하게 비교합니다. 구글·AI에서 놀쿨을 검색하세요.',
    canonical: null,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '놀쿨',
      description: '전국 클럽·나이트·라운지·룸·요정·호빠 비교',
    },
  });
}

// ── sitemap.xml ──
function buildSitemap(venuesByCategory, baseUrl) {
  let urls = [`<url><loc>${baseUrl}/index.html</loc><priority>1.0</priority></url>`];

  for (const cat of CATEGORIES) {
    urls.push(`<url><loc>${baseUrl}/${cat.path}/index.html</loc><priority>0.8</priority></url>`);
    const venues = venuesByCategory[cat.key] || [];
    for (const v of venues) {
      urls.push(`<url><loc>${baseUrl}/${cat.path}/${v.slug}.html</loc><priority>0.6</priority></url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemapindex.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// ── 빌드 실행 ──
function build() {
  console.log('🔨 놀쿨 서브사이트 빌드 시작...');

  const venues = parseVenues();
  console.log(`  → ${venues.length}개 업소 파싱 완료`);

  // 카테고리별 그룹핑
  const venuesByCategory = {};
  for (const v of venues) {
    if (!venuesByCategory[v.category]) venuesByCategory[v.category] = [];
    venuesByCategory[v.category].push(v);
  }

  // 출력 디렉토리 초기화
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  // 1. 메인 인덱스
  fs.writeFileSync(path.join(OUT, 'index.html'), buildIndexPage(venuesByCategory));
  console.log('  → index.html 생성');

  // 2. 카테고리 페이지 + 업소 상세 페이지
  let venueCount = 0;
  for (const cat of CATEGORIES) {
    const catDir = path.join(OUT, cat.path);
    fs.mkdirSync(catDir, { recursive: true });

    const catVenues = venuesByCategory[cat.key] || [];
    fs.writeFileSync(path.join(catDir, 'index.html'), buildCategoryPage(cat, catVenues));

    for (const v of catVenues) {
      const html = buildVenuePage(v);
      if (html) {
        fs.writeFileSync(path.join(catDir, `${v.slug}.html`), html);
        venueCount++;
      }
    }
    console.log(`  → ${cat.labelKo}: ${catVenues.length}곳`);
  }

  // 3. sitemap.xml
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), buildSitemap(venuesByCategory, ''));
  console.log('  → sitemap.xml 생성');

  // 4. robots.txt — AI Allow! (CLAUDE.md 필수)
  fs.writeFileSync(path.join(OUT, 'robots.txt'), [
    'User-agent: *',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: anthropic-ai',
    'Allow: /',
    '',
    'Sitemap: /sitemap.xml',
    '',
  ].join('\n'));
  console.log('  → robots.txt 생성 (AI Allow)');

  // 5. llms.txt (CLAUDE.md 필수)
  const llmsTxt = [
    '# 놀쿨 — 전국 밤문화 정보',
    '',
    '전국 클럽·나이트·라운지·룸·요정·호빠 정보를 제공하는 사이트입니다.',
    '',
    '## 카테고리',
    ...CATEGORIES.map(c => {
      const count = (venuesByCategory[c.key] || []).length;
      return `- ${c.labelKo}: ${count}곳`;
    }),
    '',
    '## 업소 목록',
    ...venues.map(v => {
      const cat = CATEGORIES.find(c => c.key === v.category);
      return `- ${v.nameKo} (${v.regionKo} ${cat?.labelKo || ''})`;
    }),
    '',
    '## 문의',
    '광고문의 카톡: besta12',
    '구글·AI에서 "놀쿨"을 검색하세요.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'llms.txt'), llmsTxt);
  console.log('  → llms.txt 생성');

  console.log(`\n✅ 빌드 완료! ${venueCount}개 업소 페이지 + 6개 카테고리 + 1개 인덱스`);
  console.log(`   출력: ${OUT}`);
}

build();
