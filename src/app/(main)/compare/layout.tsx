import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '업소 비교 — 2~3곳 나란히 비교하고 투표 | 오늘밤어디',
  description: '마음에 드는 업소 2~3곳을 골라서 나란히 비교. 카테고리, 가격, 분위기, 특징을 한눈에 보고 투표까지.',
  openGraph: {
    images: [{ url: 'https://placehold.co/1200x630/8B5CF6/ffffff/png?text=%EC%97%85%EC%86%8C+%EB%B9%84%EA%B5%90+%7C+%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630 }],
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
