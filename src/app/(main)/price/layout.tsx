import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '가격 비교 — 전국 업소 입장료·주대 한눈에 | 오늘밤어디',
  description: '입장료, 주대, 음료 가격을 6개 업종별로 한눈에 비교표. 확인된 실제 가격 정보만 정리했습니다.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/og/main.svg', width: 1200, height: 630 }],
  },
};

export default function PriceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
