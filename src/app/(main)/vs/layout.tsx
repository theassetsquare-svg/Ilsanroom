import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VS 대결 투표 — 어디가 더 나을까? | 오늘밤어디',
  description: '강남 vs 홍대, 클럽 vs 라운지. 인기 업소끼리 실시간 대결! 투표하고 결과 확인.',
  openGraph: {
    images: [{ url: 'https://placehold.co/1200x630/E11D48/ffffff/png?text=VS+%EB%8C%80%EA%B2%B0+%7C+%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630 }],
  },
};

export default function VSLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
