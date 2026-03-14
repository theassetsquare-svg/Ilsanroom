'use client';

import dynamic from 'next/dynamic';

const VSBattle = dynamic(() => import('@/components/interactive/VSBattle'), { ssr: false });

export default function VSPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">VS 대결 투표</h1>
        <p className="text-neon-text-muted">업소끼리 실시간 대결! 당신의 선택은?</p>
      </div>
      <VSBattle />
    </div>
  );
}
