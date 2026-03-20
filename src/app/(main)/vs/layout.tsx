import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VS 대결 투표 — 어디가 더 나을까? | 오늘밤어디',
  description: '강남 vs 홍대, 클럽 vs 라운지. 인기 업소끼리 실시간 대결! 투표하고 결과 확인.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/api/og?title=오늘밤어디&subtitle=밤문화+정보&bg=%238B5CF6', width: 1200, height: 630 }],
  },
};

export default function VSLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
