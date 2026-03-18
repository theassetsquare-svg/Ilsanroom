import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '인기 랭킹 TOP 20 — 지금 가장 핫한 곳 | 오늘밤어디',
  description: '전국 업소 인기 순위. 일간·주간·월간 랭킹, 카테고리별·지역별 필터로 지금 뜨는 곳을 확인하세요.',
  openGraph: {
    images: [{ url: 'https://placehold.co/1200x630/E11D48/ffffff/png?text=%EB%9E%AD%ED%82%B9+TOP20+%7C+%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630 }],
  },
};

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
