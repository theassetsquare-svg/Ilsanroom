'use client';

import Link from 'next/link';

export default function QuizCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link href="/quiz" target="_blank" rel="noopener noreferrer" className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-neon-accent/30 bg-gradient-to-r from-neon-accent/5 via-neon-surface to-neon-primary/5 p-8 transition-all hover:border-neon-accent/50 card-hover">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-neon-accent/5 blur-2xl" />
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between">
            <div>
              <p className="text-sm font-medium text-neon-accent mb-1">취향 테스트</p>
              <h3 className="text-xl font-bold text-neon-text sm:text-2xl">
                나에게 맞는 업소는? 30초 퀴즈로 알아보세요
              </h3>
              <p className="mt-2 text-sm text-neon-text-muted">
                취향, 예산, 분위기 기반으로 맞춤 업소를 추천해 드립니다.
              </p>
            </div>
            <span className="mt-4 sm:mt-0 sm:ml-6 shrink-0 inline-flex items-center gap-2 rounded-xl border border-neon-accent/40 px-6 py-3 text-sm font-semibold text-neon-accent transition-all group-hover:bg-neon-accent/10">
              퀴즈 시작 →
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
