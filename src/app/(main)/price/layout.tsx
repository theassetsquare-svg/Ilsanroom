import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '가격 비교 — 전국 업소 입장료·주대 한눈에 | 오늘밤어디',
  description: '입장료, 주대, 음료 가격을 6개 업종별로 한눈에 비교표. 확인된 실제 가격 정보만 정리했습니다.',
  openGraph: {
    images: [{ url: 'https://placehold.co/1200x630/8B5CF6/ffffff/png?text=%EA%B0%80%EA%B2%A9+%EB%B9%84%EA%B5%90+%7C+%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630 }],
  },
};

export default function PriceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
