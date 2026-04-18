import { lazy, Suspense } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';

const VSBattle = lazy(() => import('@/components/interactive/VSBattle'));

export default function VSPage() {
  useDocumentMeta('어디가 더 낫냐고? 투표로 결판내자', '인기 업소끼리 맞짱. 한 표 던지고 실시간 결과 확인해봐.');
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">VS 대결 투표</h1>
        <p className="text-neon-text-muted mb-2">업소끼리 실시간 대결! 당신의 선택은?</p>
        <PageLiveCounter pageName="투표 참여 중" baseCount={44} />
      </div>
      <Suspense fallback={
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" />
        </div>
      }>
        <VSBattle />
      </Suspense>
    </div>
  );
}
