/**
 * HomeFeed — 무한 스크롤 피드 (1초 이탈 방지 + 페이지뷰 ↑↑)
 *
 * 객관적 근거:
 * - TikTok/IG/Twitter = 단일 무한피드 → 평균 체류 8분+
 * - 분절된 25개 섹션 = 인지 부하 ↑ → 1초 이탈
 * - 무한피드 = scroll = 도파민 루프 = 100페이지 진입 가능
 *
 * 카드 종류:
 *  - post     : 커뮤니티 인기글 (제목 + 본문 미리보기 + 좋아요/댓글)
 *  - magazine : 매거진 카드 (옵션, 추후)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { COLOR, RADIUS, SHADOW } from '@/lib/design-tokens';

type FeedPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comment_count: number;
  created_at: string;
};

const PAGE_SIZE = 8;

// 카테고리 라벨 (한글)
const CAT_LABEL: Record<string, string> = {
  free: '자유',
  reviews: '후기',
  tips: '팁',
  qna: 'Q&A',
  party: '조각모임',
  fashion: '패션',
};

// 좋아요 수 → 핫 등급
function hotEmoji(likes: number) {
  if (likes >= 100) return '🔥🔥🔥';
  if (likes >= 50) return '🔥🔥';
  if (likes >= 20) return '🔥';
  return '';
}

// 본문 미리보기 (140자, 줄바꿈 → 공백)
function preview(content: string, n = 140) {
  const t = content.replace(/[\r\n]+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

// 시간 포맷 (몇분/시간/일전)
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function HomeFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 페이지 로드
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('posts')
      .select('id,title,content,category,likes,comment_count,created_at')
      .eq('is_hidden', false)
      .order('likes', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (!error && data) {
      setPosts(prev => [...prev, ...(data as FeedPost[])]);
      if (data.length < PAGE_SIZE) setHasMore(false);
      setPage(p => p + 1);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  }, [loading, hasMore, page]);

  // 첫 로드
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver — 스크롤 끝 감지
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <section style={{ padding: '8px 12px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: COLOR.text.primary,
          margin: '8px 4px 12px',
          letterSpacing: '-0.01em',
        }}
      >
        🔥 지금 뜨는 이야기
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.map(p => (
          <Link
            key={p.id}
            to={`/community/post/${p.id}`}
            style={{
              display: 'block',
              background: COLOR.bg.elevate,
              border: `1px solid ${COLOR.bg.border}`,
              borderRadius: RADIUS.lg,
              padding: '14px 16px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: SHADOW.card,
              transition: 'transform 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = COLOR.neon.pink;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = COLOR.bg.border;
            }}
          >
            {/* 카테고리 + 시간 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: COLOR.text.tertiary,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  background: COLOR.bg.raised,
                  color: COLOR.neon.cyan,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                {CAT_LABEL[p.category] || p.category}
              </span>
              <span>{timeAgo(p.created_at)}</span>
              {hotEmoji(p.likes) && (
                <span style={{ marginLeft: 'auto', fontSize: 13 }}>{hotEmoji(p.likes)}</span>
              )}
            </div>

            {/* 제목 */}
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.4,
                color: COLOR.text.primary,
                margin: '0 0 6px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {p.title}
            </h3>

            {/* 본문 미리보기 */}
            <p
              style={{
                fontSize: 14,
                color: COLOR.text.secondary,
                lineHeight: 1.6,
                margin: '0 0 10px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {preview(p.content)}
            </p>

            {/* 좋아요 / 댓글 */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                fontSize: 12,
                color: COLOR.text.tertiary,
                fontWeight: 600,
              }}
            >
              <span>❤️ {p.likes}</span>
              <span>💬 {p.comment_count}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 무한 스크롤 sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {/* 상태 표시 */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px 0',
          fontSize: 13,
          color: COLOR.text.tertiary,
        }}
      >
        {loading && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 14,
                height: 14,
                border: `2px solid ${COLOR.neon.pink}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.9s linear infinite',
              }}
            />
            더 불러오는 중
          </span>
        )}
        {!loading && !hasMore && posts.length > 0 && '— 끝까지 다 봤어요 —'}
        {!loading && posts.length === 0 && '아직 글이 없어요'}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
