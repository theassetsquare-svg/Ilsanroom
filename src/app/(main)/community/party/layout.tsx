import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '파티 모집 — N빵으로 함께 놀자 | 오늘밤어디 커뮤니티',
  description: '같이 놀 사람 모집! N빵 계산기로 1인당 비용 확인하고, 지역·날짜별 파티에 참여하세요.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/og/main.svg', width: 1200, height: 630 }],
  },
};

export default function PartyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
