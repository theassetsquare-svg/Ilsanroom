import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '안전 가이드 — 음주 계산기·긴급 연락처·막차 정보 | 오늘밤어디',
  description: '혈중 알코올 농도 계산, 112/119 긴급 연락, 막차 시간, 대리운전 호출까지. 안전한 밤을 위한 필수 도구.',
  openGraph: {
    images: [{ url: 'https://placehold.co/1200x630/059669/ffffff/png?text=%EC%95%88%EC%A0%84+%EA%B0%80%EC%9D%B4%EB%93%9C+%7C+%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630 }],
  },
};

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
