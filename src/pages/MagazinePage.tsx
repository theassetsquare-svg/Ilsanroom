import NcH1 from '@/components/seo/NcH1';
import { useRef } from 'react';
import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useArticles } from '@/hooks/useMagazine';
import { MidContentHook, ReadingMilestone } from '@/components/engagement/ReadingEngagement';

export default function MagazinePage() {
  useDocumentMeta('나이트라이프 읽을거리, 여기 다 모았다', '강남·홍대·이태원·일산·부산·수원 지역 안내와 업종 비교 글을 모았습니다. 처음 가는 동네라면 가기 전에 한 편 읽어 보세요.');
  const containerRef = useRef<HTMLDivElement>(null);
  const { articles } = useArticles();
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #8B5CF6 0%, transparent 50%), radial-gradient(circle at 70% 60%, #EC4899 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>총 {articles.length}편</span>
          </div>

          <NcH1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            나이트라이프 매거진 — 가기 전에 읽는 글
          </NcH1>
          <p className="text-sm sm:text-base mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
            지역 안내, 업종 비교 글 모음
          </p>

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
          <p className="text-xs text-[#595959]">가기 전에 읽으면 달라지는 글</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a, idx) => (
            <div key={a.id}>
              <Link to={`/magazine/${a.id}`} className="block group">
                <article className="rounded-2xl border bg-white p-5 transition hover:shadow-lg hover:border-[#8B5CF6]/30" style={{ borderColor: '#E5E7EB', minHeight: 180 }}>
                  <span className="rounded-full bg-[#8B5CF6]/10 px-2.5 py-0.5 text-xs font-bold" style={{ color: '#5B21B6' }}>{a.tag}</span>
                  <h3 className="mt-3 text-sm font-bold leading-snug line-clamp-2 group-hover:text-[#8B5CF6] transition-colors" style={{ color: '#111' }}>{a.title}</h3>
                  <p className="mt-2 text-xs line-clamp-3 leading-relaxed" style={{ color: '#555' }}>{a.excerpt}</p>
                  <div className="mt-3 flex items-center justify-between text-xs" style={{ color: '#595959' }}>
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

        {/* ═══ 본문 — 매거진 설명 (체류·AIO) ═══ */}
        <section className="mt-12 rounded-2xl border bg-[#FAFAFA] p-6 space-y-3" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-bold text-[#111]">매거진, 뭘 읽는 곳이냐면</h2>
          <p className="text-sm leading-relaxed text-[#555]">
            가기 전에 읽어 두면 좋은 글을 모았습니다. 강남·홍대·이태원 같은 동네를 한 번에 살펴보는 지역 안내와, 클럽과 라운지가 어떻게 다른지 견주는 업종 가이드가 주로 올라옵니다.
          </p>
          <ul className="space-y-1 text-sm text-[#555]">
            <li>· <b>지역 안내</b> — 한 동네 안에서 성격이 다른 가게를 나란히 놓고 보기</li>
            <li>· <b>업종 비교</b> — 클럽 vs 라운지 vs 나이트, 오늘 기분엔 어디가 맞는지</li>
          </ul>
          <p className="text-sm leading-relaxed text-[#555]">
            읽다가 끌리는 곳이 생기면 글 안의 링크로 바로 그 업소 상세로 넘어가면 됩니다. 주말 계획 짜기 전 한 번 훑어보세요.
          </p>
        </section>

      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
