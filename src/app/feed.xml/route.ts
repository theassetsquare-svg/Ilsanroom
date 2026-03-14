export const dynamic = "force-static";
import { NextResponse } from 'next/server';

const articles = [
  { title: '2026 대한민국 나이트라이프 트렌드 리포트', date: '2026-03-10', slug: 'trend-report-2026', category: '트렌드' },
  { title: '강남 vs 홍대: 두 개의 클럽 문화', date: '2026-03-08', slug: 'gangnam-vs-hongdae', category: '문화' },
  { title: 'DJ 인터뷰: 한국 EDM 씬의 현재와 미래', date: '2026-03-06', slug: 'dj-interview-edm', category: '인터뷰' },
  { title: '라운지 바 문화 입문 가이드', date: '2026-03-04', slug: 'lounge-bar-guide', category: '가이드' },
  { title: '해운대 나이트라이프의 사계절', date: '2026-03-02', slug: 'haeundae-seasons', category: '여행' },
  { title: '나이트클럽의 역사: 한국 나이트 문화 40년', date: '2026-02-28', slug: 'nightclub-history', category: '역사' },
  { title: '일산 명월관 요정 — 비즈니스 접대의 새로운 기준', date: '2026-03-12', slug: 'ilsan-myeongwolgwan-business', category: '비즈니스' },
  { title: '일산 룸 문화 가이드 — 프라이빗 모임의 정석', date: '2026-03-11', slug: 'ilsan-room-guide', category: '가이드' },
];

export async function GET() {
  const siteUrl = 'https://neon-nightlife.com';

  const items = articles.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${siteUrl}/magazine/${a.slug}</link>
      <guid>${siteUrl}/magazine/${a.slug}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <category>${a.category}</category>
      <description><![CDATA[NEON 매거진 - ${a.title}]]></description>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NEON 나이트라이프 매거진</title>
    <link>${siteUrl}/magazine</link>
    <description>대한민국 No.1 나이트라이프 가이드 NEON의 매거진과 커뮤니티 소식</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
