import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { articles } from '@/data/magazine-articles';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, ReadFinishCount, ReadingMilestone } from '@/components/engagement/ReadingEngagement';

export default function MagazinePage() {
  useDocumentMeta('밤문화 읽을거리, 여기 다 모았다', '지역 분석, 업종 비교, 현장 리포트. 가기 전에 읽으면 달라지는 글.');
  const containerRef = useRef<HTMLDivElement>(null);
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #8B5CF6 0%, transparent 50%), radial-gradient(circle at 70% 60%, #EC4899 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <PageLiveCounter pageName="매거진 읽는 중" baseCount={37} className="text-white/80 [&_strong]:text-white" />
            </div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>총 {articles.length}편</span>
          </div>

          {/* 피처드 아티클 — 대형 카드 */}
          <Link to={`/magazine/${featured.id}`} className="block group">
            <div className="rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 via-white/5 to-[#EC4899]/10 border border-white/10 p-8 sm:p-10 transition-all hover:border-white/20 hover:shadow-2xl hover:shadow-purple-900/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-full bg-[#8B5CF6] px-3 py-1 text-xs font-bold" style={{ color: '#FFFFFF' }}>{featured.tag}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{featured.date}</span>
                <span className="text-xs font-bold ml-auto" style={{ color: '#FBBF24' }}>FEATURED</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-4 group-hover:text-[#C4B5FD] transition-colors" style={{ color: '#FFFFFF' }}>{featured.title}</h2>
              <p className="text-base leading-relaxed line-clamp-3" style={{ lineHeight: '1.8', color: 'rgba(255,255,255,0.6)' }}>{featured.excerpt}</p>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-sm font-bold group-hover:text-[#C4B5FD] transition-colors" style={{ color: '#8B5CF6' }}>읽으러 가기 →</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ═══ GRID ═══ */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#111]">전체 매거진</h2>
          <p className="text-xs text-[#999]">가기 전에 읽으면 달라지는 글</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a, idx) => (
            <div key={a.id}>
              <Link to={`/magazine/${a.id}`} className="block group">
                <article className="rounded-2xl border bg-white p-5 transition hover:shadow-lg hover:border-[#8B5CF6]/30" style={{ borderColor: '#E5E7EB', minHeight: 180 }}>
                  <span className="rounded-full bg-[#8B5CF6]/10 px-2.5 py-0.5 text-xs font-bold" style={{ color: '#8B5CF6' }}>{a.tag}</span>
                  <h3 className="mt-3 text-sm font-bold leading-snug line-clamp-2 group-hover:text-[#8B5CF6] transition-colors" style={{ color: '#111' }}>{a.title}</h3>
                  <p className="mt-2 text-xs line-clamp-3 leading-relaxed" style={{ color: '#555' }}>{a.excerpt}</p>
                  <div className="mt-3 flex items-center justify-between text-xs" style={{ color: '#999' }}>
                    <span>{a.date}</span>
                    <span className="text-[#8B5CF6] font-medium opacity-0 group-hover:opacity-100 transition-opacity">읽기 →</span>
                  </div>
                </article>
              </Link>
              {/* 3개 뒤에 중간 훅 */}
              {idx === 2 && rest.length > 3 && <MidContentHook seed="magazine-mid" variant={3} />}
            </div>
          ))}
        </div>

        {/* ═══ BOTTOM ═══ */}
        <div className="mt-10 text-center space-y-3">
          <ReadFinishCount pageName="매거진 목록" baseCount={120} />
          <p className="text-xs text-[#999]">매주 새로운 글이 올라옵니다</p>
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
