import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '오늘밤어디';
  const subtitle = searchParams.get('subtitle') || '전국 클럽·나이트·라운지·룸·요정·호빠';
  const staff = searchParams.get('staff') || '';
  const bg = searchParams.get('bg') || '#8B5CF6';

  // Title font size: shrink for long names
  const titleLen = title.length;
  const titleSize = titleLen > 15 ? 48 : titleLen > 10 ? 56 : 64;
  const titleY = staff ? 260 : 280;
  const staffLine = staff
    ? `<text x="600" y="${titleY + 70}" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="600" fill="#FCD34D">${escapeXml(staff)}</text>`
    : '';
  const subtitleY = staff ? titleY + 120 : titleY + 80;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${escapeXml(bg)};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="rgba(255,255,255,0.08)"/>
  <text x="600" y="${titleY}" text-anchor="middle" font-family="sans-serif" font-size="${titleSize}" font-weight="bold" fill="white">${escapeXml(title)}</text>
  ${staffLine}
  <text x="600" y="${subtitleY}" text-anchor="middle" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.7)">${escapeXml(subtitle)}</text>
  <text x="600" y="540" text-anchor="middle" font-family="sans-serif" font-size="22" fill="rgba(255,255,255,0.4)">오늘밤어디 — ilsanroom.pages.dev</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
