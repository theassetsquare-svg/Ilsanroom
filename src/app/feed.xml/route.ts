export const dynamic = "force-static";

const SITE_URL = 'https://ilsanroom.pages.dev';

const entries = [
  { headline: '수도권 남부 EDM 시설 5곳 리뷰', published: '2026-03-12', path: 'gangnam-club-top5', tag: '취재', summary: '사운드 시스템·LED 조명·드레스코드를 직접 확인하고 요약했습니다.' },
  { headline: '고양시 요정 체험기 — 코스 요리와 국악 라이브', published: '2026-03-10', path: 'ilsan-myeongwolgwan-guide', tag: '체험', summary: '개별 좌석 30석, 코스 요리 15종을 보유한 격조 높은 장소 이용법.' },
  { headline: 'EDM 장소 vs 사교 장소 — 차이점 해설', published: '2026-03-08', path: 'club-vs-night', tag: '분석', summary: '경영 형태·고객 연령·드레스코드가 완전히 구별되는 두 업종 설명.' },
  { headline: '사교장 초보 입장 순서 안내', published: '2026-03-05', path: 'night-beginner-guide', tag: '입문', summary: '복장·예의·음료 선택 등 처음 오는 분을 위한 핵심 정보.' },
  { headline: '서울 서측·남측 야간 타운 차이', published: '2026-03-03', path: 'hongdae-vs-itaewon', tag: '지역', summary: '로컬 인디 구역과 글로벌 구역의 색다른 매력 분석.' },
  { headline: '전국 권역별 사교장 현황 요약', published: '2026-02-28', path: 'nationwide-night-guide', tag: '종합', summary: '수도권·영남·호남·충청 등 권역별 야간 생활 현황.' },
  { headline: '고양시 프리미엄 개인 공간 예약 흐름', published: '2026-02-25', path: 'ilsan-room-guide', tag: '예약', summary: '중심가 프라이빗 개인 공간 예약과 이용 절차 설명.' },
  { headline: '업종별 드레스코드 체크리스트', published: '2026-02-20', path: 'dresscode-guide', tag: '팁', summary: '각 업종에 맞는 권장 의상 목록과 주의 사항.' },
];

export async function GET() {
  const items = entries.map((e) => `
    <item>
      <title><![CDATA[${e.headline}]]></title>
      <link>${SITE_URL}/magazine</link>
      <guid isPermaLink="false">${SITE_URL}/magazine#${e.path}</guid>
      <pubDate>${new Date(e.published).toUTCString()}</pubDate>
      <category>${e.tag}</category>
      <description><![CDATA[${e.summary}]]></description>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>오늘밤어디 소식</title>
    <link>${SITE_URL}</link>
    <description>야간 생활 소식·현장 리뷰·팁</description>
    <language>ko</language>
    <lastBuildDate>${new Date('2026-03-15').toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
