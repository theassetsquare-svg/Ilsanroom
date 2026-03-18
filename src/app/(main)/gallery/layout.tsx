import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '포토 갤러리 — 업소 분위기 미리보기 | 오늘밤어디',
  description: '전국 업소 분위기 사진 갤러리. 카테고리별 필터, Masonry 레이아웃으로 한눈에 분위기 확인.',
  openGraph: {
    images: [{ url: 'https://placehold.co/1200x630/0891B2/ffffff/png?text=%EA%B0%A4%EB%9F%AC%EB%A6%AC+%7C+%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630 }],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
