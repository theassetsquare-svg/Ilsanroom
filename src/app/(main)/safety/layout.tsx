import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '안전 가이드 — 음주 계산기·긴급 연락처·막차 정보 | 오늘밤어디',
  description: '혈중 알코올 농도 계산, 112/119 긴급 연락, 막차 시간, 대리운전 호출까지. 안전한 밤을 위한 필수 도구.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/api/og?title=오늘밤어디&subtitle=밤문화+정보&bg=%238B5CF6', width: 1200, height: 630 }],
  },
};

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
