import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getArticleById, articles } from '@/data/magazine-articles';
import ShareButton from '@/components/ui/ShareButton';

export default function MagazineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const article = id ? getArticleById(id) : undefined;

  useDocumentMeta(
    article?.title || '매거진 글',
    article?.excerpt || '놀쿨 매거진 콘텐츠'
  );

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-bold mb-4" style={{ color: '#111' }}>글을 찾을 수 없습니다</p>
        <Link to="/magazine" className="text-sm" style={{ color: '#8B5CF6' }}>매거진으로 돌아가기</Link>
      </div>
    );
  }

  // 관련 글 (현재 글 제외, 최대 3개)
  const relatedArticles = articles.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} className="text-sm mb-6" style={{ color: '#555', minHeight: 44 }}>← 매거진</button>

      {/* 태그 + 날짜 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6' }}>{article.tag}</span>
        <span className="text-xs" style={{ color: '#999' }}>{article.date}</span>
      </div>

      {/* 제목 */}
      <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4" style={{ color: '#111' }}>{article.title}</h1>

      {/* 요약 */}
      <p className="text-base leading-relaxed mb-6" style={{ color: '#555', lineHeight: '1.8' }}>{article.excerpt}</p>

      {/* 구분선 */}
      <div className="border-t mb-6" style={{ borderColor: '#E5E7EB' }} />

      {/* 본문 */}
      <div
        className="rich-content text-base leading-relaxed mb-8"
        style={{ color: '#333', lineHeight: '1.9' }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* 공유 */}
      <div className="flex items-center gap-3 mb-8 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
        <ShareButton title={article.title} text={article.excerpt} />
        <span className="text-xs" style={{ color: '#999' }}>이 글이 유용했다면 공유해주세요</span>
      </div>

      {/* 관련 글 */}
      {relatedArticles.length > 0 && (
        <div className="pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>다른 매거진 글</h2>
          <div className="space-y-3">
            {relatedArticles.map(a => (
              <Link
                key={a.id}
                to={`/magazine/${a.id}`}
                className="block rounded-xl border p-4 transition hover:border-[#8B5CF6]/30 hover:shadow-sm"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6' }}>{a.tag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: '#111' }}>{a.title}</p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#555' }}>{a.excerpt}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
