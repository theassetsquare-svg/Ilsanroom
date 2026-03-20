import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지도 — 내 주변 업소 찾기 | 오늘밤어디',
  description: '카카오맵 기반 전국 업소 지도. GPS로 내 주변 검색, 카테고리 필터, 마커 클릭으로 상세 정보 바로 확인.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/og/main.svg', width: 1200, height: 630 }],
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
