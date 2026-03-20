import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '인기 랭킹 TOP 20 — 지금 가장 핫한 곳 | 오늘밤어디',
  description: '조회수·재방문률·별점 기반 주간 TOP 20. 카테고리별·지역별 필터로 지금 뜨는 곳을 확인하세요.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/og/main.svg', width: 1200, height: 630 }],
  },
};

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
