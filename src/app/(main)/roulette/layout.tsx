import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '오늘 갈 곳 룰렛 — 랜덤 업소 추천 | 오늘밤어디',
  description: '어디 갈지 모르겠다면 돌려봐! 전국 127개 업소 중 랜덤 추천. 운명의 업소를 만나보세요.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/og/main.svg', width: 1200, height: 630 }],
  },
};

export default function RouletteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
