import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { articles as localArticles } from '@/data/magazine-articles';
import { useArticle, useArticles } from '@/hooks/useMagazine';
import ShareButton from '@/components/ui/ShareButton';
import StickyPhoneBar from '@/components/venue/StickyPhoneBar';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { ReadTimeEstimate, MidContentHook, ReadFinishCount, ReadCompletionReward, ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import RelatedVenuesForMagazine from '@/components/magazine/RelatedVenuesForMagazine';

export default function MagazineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { article: dbArticle } = useArticle(id);
  const article = dbArticle || (id ? localArticles.find(a => a.id === id) : undefined);
  const { articles } = useArticles();
  const containerRef = useRef<HTMLDivElement>(null);

  useDocumentMeta(
    article?.title || '매거진 글',
    article?.excerpt || '밤문화 현장 리포트와 깊이 있는 분석 매거진'
  );

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-bold mb-4" style={{ color: '#111' }}>글을 찾을 수 없습니다</p>
        <Link to="/magazine" className="text-sm" style={{ color: '#8B5CF6' }}>매거진으로 돌아가기</Link>
      </div>
    );
  }

  const relatedArticles = articles.filter(a => a.id !== article.id).slice(0, 3);
  const contentLength = (article.content || '').length + (article.excerpt || '').length;

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="bg-gradient-to-b from-[#F8F6FF] via-white to-white border-b border-gray-100">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* 뒤로가기 */}
          <button onClick={() => navigate(-1)} className="text-sm mb-6 flex items-center gap-1 text-[#8B5CF6] hover:text-[#7C3AED] transition" style={{ minHeight: 44 }}>
            ← 매거진
          </button>

          {/* 메타 */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: '#8B5CF6', color: 'white' }}>{article.tag}</span>
            <span className="text-xs" style={{ color: '#999' }}>{article.date}</span>
            <ReadTimeEstimate charCount={contentLength} />
            <PageLiveCounter pageName="이 글 읽는 중" baseCount={18} />
          </div>

          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4" style={{ color: '#111' }}>{article.title}</h1>

          {/* 요약 */}
          <p className="text-base leading-relaxed" style={{ color: '#555', lineHeight: '1.8' }}>{article.excerpt}</p>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* 본문 */}
        <div
          className="rich-content text-base leading-relaxed mb-8"
          style={{ color: '#333', lineHeight: '1.9' }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* 중간 훅 */}
        <MidContentHook seed={article.id} />

        {/* 공유 */}
        <div className="flex items-center gap-3 mb-8 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <ShareButton title={article.title} text={article.excerpt} />
          <span className="text-xs" style={{ color: '#999' }}>이 글이 유용했다면 공유해주세요</span>
        </div>

        {/* ═══ 글 하단 전화 CTA (담당자 폰 있는 글만) ═══ */}
        {(article as { phone?: string; staffName?: string; venueSlug?: string; venueName?: string }).phone && (
          <div className="mb-8 rounded-2xl p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', border: '1px solid #BBF7D0' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#15803D' }}>지금 예약·문의</p>
            <p className="text-base sm:text-lg font-extrabold mb-3" style={{ color: '#111' }}>
              {(article as { venueName?: string }).venueName || '담당자'}{' '}
              {(article as { staffName?: string }).staffName}이 직접 안내합니다
            </p>
            <a
              href={`tel:${((article as { phone?: string }).phone || '').replace(/-/g, '')}`}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full px-6 py-4 min-h-[52px] text-base font-extrabold text-white shadow-lg transition active:scale-95"
              style={{ background: '#15803D' }}
              aria-label={`${(article as { staffName?: string }).staffName || '담당자'} ${(article as { phone?: string }).phone} 전화걸기`}
            >
              <span style={{ fontSize: '20px' }}>📞</span>
              <span>
                {(article as { staffName?: string }).staffName} {(article as { phone?: string }).phone}
              </span>
            </a>
            {(article as { venueSlug?: string }).venueSlug && (
              <Link
                to={`/yojeong/ilsan/${(article as { venueSlug?: string }).venueSlug}/`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold"
                style={{ color: '#15803D' }}
              >
                {(article as { venueName?: string }).venueName} 상세 페이지 →
              </Link>
            )}
          </div>
        )}

        {/* ═══ BOTTOM REWARD ═══ */}
        <ReadCompletionReward teaser="끝까지 읽은 사람만 보는 추가 정보">
          <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
            이 글에서 다루지 못한 현장 이야기가 커뮤니티에 더 있습니다.
            직접 다녀온 사람들의 생생한 후기를 확인해보세요.
          </p>
          <Link
            to="/community"
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED]"
          >
            커뮤니티 후기 보기 →
          </Link>
        </ReadCompletionReward>

        {/* 완독자 수 */}
        <div className="text-center mt-6 mb-8">
          <ReadFinishCount pageName="이 글" baseCount={90} />
        </div>

        {/* ═══ 시즌72 — 매거진 SEO 보강 H2 (8글 동시 적용) ═══ */}
        <div className="pt-6 mt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#111' }}>독자가 자주 묻는 것</h2>
          <div className="space-y-3 text-sm" style={{ color: '#444', lineHeight: '1.8' }}>
            <div>
              <p className="font-bold mb-1" style={{ color: '#111' }}>Q. 글에 나온 가게 직접 가도 되나요?</p>
              <p>네, 본문에 언급된 가게는 모두 실제 영업 중인 곳입니다. 단 운영시간·휴무는 방문 전 한 번 더 확인하는 게 안전합니다.</p>
            </div>
            <div>
              <p className="font-bold mb-1" style={{ color: '#111' }}>Q. 처음 가는 사람도 부담 없을까요?</p>
              <p>업종마다 분위기가 달라서 초행자가 멈칫하는 포인트가 있습니다. 본문 중반에 정리한 매너·동선 부분을 한 번 읽고 가면 어색함 없이 자연스럽게 섞입니다.</p>
            </div>
            <div>
              <p className="font-bold mb-1" style={{ color: '#111' }}>Q. 본문에 없는 추가 정보는 어디서 보나요?</p>
              <p>커뮤니티에 같은 가게 다녀온 사람들이 남긴 후기가 더 있습니다. 시간대별 분위기·줄·웨이팅 같은 디테일은 매거진보다 커뮤니티가 빠릅니다.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#111' }}>이 글 다 읽었다면 다음 단계</h2>
          <p className="text-sm" style={{ color: '#444', lineHeight: '1.8' }}>
            여기까지 읽었다면 단순 검색으로 들어온 사람보다 훨씬 깊이 알게 된 상태입니다.
            아래 관련 가게 카드를 눌러 직접 라인업·부스·분위기를 확인하거나, 커뮤니티에서
            같은 주제로 이야기 나누는 회원들의 실시간 코멘트를 살펴보세요. 매거진은 정리,
            커뮤니티는 현장 — 두 곳을 같이 보면 처음 가는 가게도 단골처럼 자신 있게 들어갈 수 있습니다.
          </p>
        </div>

        {/* 관련 venue — 본문 키워드 기반 자동 cross-link */}
        <RelatedVenuesForMagazine
          articleTitle={article.title}
          articleExcerpt={article.excerpt}
          articleTag={article.tag}
        />

        {/* 관련 글 */}
        {relatedArticles.length > 0 && (
          <div className="pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#111' }}>이것도 읽어보면 좋다</h2>
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

      <ReadingMilestone containerRef={containerRef} />

      {/* ═══ Sticky 전화바 — phone 필드 있는 글만 표시 ═══ */}
      <StickyPhoneBar
        phone={(article as { phone?: string }).phone}
        staffName={(article as { staffName?: string }).staffName}
        venueName={(article as { venueName?: string }).venueName || article.title}
      />
    </div>
  );
}
