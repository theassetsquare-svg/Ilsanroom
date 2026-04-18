import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { articles } from '@/data/magazine-articles';
import { PageLiveCounter } from '@/components/ui/LiveStats';

export default function MagazinePage() {
  useDocumentMeta('밤문화 읽을거리, 여기 다 모았다', '지역 분석, 업종 비교, 현장 리포트. 가기 전에 읽으면 달라지는 글.');
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#111' }}>매거진</h1>
      <p className="text-sm mb-2" style={{ color: '#555' }}>밤문화 트렌드, 가이드, 분석 콘텐츠</p>
      <div className="mb-8"><PageLiveCounter pageName="매거진 읽는 중" baseCount={37} /></div>

      {/* 피처드 — 첫 번째 글 */}
      <Link to={`/magazine/${articles[0].id}`} className="block mb-8">
        <article className="rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-br from-[#F3F0FF] via-white to-[#F5F5F5] p-6 sm:p-8 transition hover:shadow-lg hover:border-[#8B5CF6]/40">
          <span className="rounded-full bg-[#8B5CF6]/10 px-3 py-1 text-xs font-bold" style={{ color: '#8B5CF6' }}>{articles[0].tag}</span>
          <h2 className="mt-3 text-xl sm:text-2xl font-bold leading-snug" style={{ color: '#111' }}>{articles[0].title}</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#555' }}>{articles[0].excerpt}</p>
          <div className="mt-4 flex items-center gap-3 text-xs" style={{ color: '#999' }}>
            <span>{articles[0].date}</span>
          </div>
        </article>
      </Link>

      {/* 그리드 — 나머지 글 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(1).map((a) => (
          <Link key={a.id} to={`/magazine/${a.id}`} className="block">
            <article className="rounded-2xl border bg-white p-5 transition hover:shadow-lg hover:border-[#8B5CF6]/30" style={{ borderColor: '#E5E7EB', minHeight: 180 }}>
              <span className="rounded-full bg-[#8B5CF6]/10 px-2.5 py-0.5 text-xs font-bold" style={{ color: '#8B5CF6' }}>{a.tag}</span>
              <h3 className="mt-3 text-sm font-bold leading-snug line-clamp-2" style={{ color: '#111' }}>{a.title}</h3>
              <p className="mt-2 text-xs line-clamp-3 leading-relaxed" style={{ color: '#555' }}>{a.excerpt}</p>
              <div className="mt-3 text-xs" style={{ color: '#999' }}>
                <span>{a.date}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
