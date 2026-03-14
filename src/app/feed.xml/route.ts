export const dynamic = "force-static";

const SITE_URL = 'https://ilsanroom.pages.dev';

const articles = [
  { title: '2026 강남 클럽 TOP5 — 올해 꼭 가봐야 할 곳', date: '2026-03-12', slug: 'gangnam-club-top5', category: '클럽' },
  { title: '일산명월관요정 완벽 가이드: 접대부터 가족모임까지', date: '2026-03-10', slug: 'ilsan-myeongwolgwan-guide', category: '요정' },
  { title: '클럽 vs 나이트 — 완전히 다른 두 문화', date: '2026-03-08', slug: 'club-vs-night', category: '가이드' },
  { title: '처음 나이트 가는 분을 위한 A to Z 매너 가이드', date: '2026-03-05', slug: 'night-beginner-guide', category: '나이트' },
  { title: '홍대 vs 이태원 클럽 비교', date: '2026-03-03', slug: 'hongdae-vs-itaewon', category: '비교' },
  { title: '전국 나이트클럽 지역별 특징 총정리', date: '2026-02-28', slug: 'nationwide-night-guide', category: '정보' },
  { title: '일산룸 프리미엄 비즈니스 룸 가이드', date: '2026-02-25', slug: 'ilsan-room-guide', category: '룸' },
  { title: '드레스코드 완벽 가이드 — 업종별 복장 정리', date: '2026-02-20', slug: 'dresscode-guide', category: '패션' },
];

export async function GET() {
  const items = articles.map((a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${SITE_URL}/magazine</link>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <category>${a.category}</category>
      <description><![CDATA[${a.title} - 오늘밤어디 매거진]]></description>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>오늘밤어디 매거진</title>
    <link>${SITE_URL}</link>
    <description>일산룸, 일산명월관요정 등 전국 나이트라이프 업소 정보와 가이드</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
