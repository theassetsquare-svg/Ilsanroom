import { lazy, Suspense } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const VSBattle = lazy(() => import('@/components/interactive/VSBattle'));

export default function VSPage() {
  useDocumentMeta('이번 주 대결, 한 표가 승부를 가른다 | 밤키', '인기 업소끼리 실시간 투표 배틀. 매주 새 대결 업데이트.');
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">VS 대결 투표</h1>
        <p className="text-neon-text-muted">업소끼리 실시간 대결! 당신의 선택은?</p>
      </div>
      <Suspense fallback={null}><VSBattle /></Suspense>
    </div>
  );
}
