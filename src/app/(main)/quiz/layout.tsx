import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '나에게 맞는 밤문화 유형 테스트 | 오늘밤어디',
  description: '10문항 퀴즈로 알아보는 내 밤문화 MBTI. 클럽형? 라운지형? 나에게 딱 맞는 업소까지 추천.',
  openGraph: {
    images: [{ url: 'https://ilsanroom.pages.dev/api/og?title=오늘밤어디&subtitle=밤문화+정보&bg=%238B5CF6', width: 1200, height: 630 }],
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
