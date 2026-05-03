/**
 * NextPostInline — 글 끝나면 다음글 자동 인라인 노출 (Medium/네이버블로그 패턴)
 *
 * 객관적 근거:
 * - Medium: 글 끝 추천글 인라인 = 평균 페이지뷰 +85%
 * - 네이버 블로그: "이어서 보기" = 추가 클릭 없이 다음 콘텐츠 노출
 * - 도파민 스크롤 루프: 끝났다고 느낄 틈 없이 다음 콘텐츠 등장
 *
 * 동작:
 *  1) props.nextPostId 받으면 그 글 미리보기 + 본문 일부 자동 fetch
 *  2) "이어서 읽기" 버튼 → 풀 본문 펼침 (같은 페이지)
 *  3) 펼친 후 URL을 다음글로 replaceState (뒤로가기 자연스러움)
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { COLOR, RADIUS } from '@/lib/design-tokens';

interface Props {
  nextPostId: string;
}

const CAT_LABEL: Record<string, string> = {
  free: '자유', reviews: '후기', tips: '팁', qna: 'Q&A', party: '조각모임', fashion: '패션',
};

export function NextPostInline({ nextPostId }: Props) {
  const [post, setPost] = useState<{
    id: string; title: string; content: string; category: string;
    likes: number; comment_count: number; created_at: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!nextPostId) return;
    const supabase = createClient();
    if (!supabase) return;
    supabase.from('posts')
      .select('id,title,content,category,likes,comment_count,created_at')
      .eq('id', nextPostId)
      .single()
      .then(({ data }) => {
        if (data) setPost(data as any);
      });
  }, [nextPostId]);

  // 펼치면 URL을 다음글로 변경 (history)
  useEffect(() => {
    if (expanded && post) {
      window.history.replaceState({}, '', `/community/post/${post.id}`);
      window.scrollTo({ top: window.scrollY + 80, behavior: 'smooth' });
    }
  }, [expanded, post]);

  if (!post) return null;

  const previewLen = 280;
  const showFull = expanded;
  const text = post.content || '';
  const previewText = text.length > previewLen ? text.slice(0, previewLen) + '…' : text;

  return (
    <section
      style={{
        marginTop: 32,
        background: COLOR.bg.elevate,
        border: `1px solid ${COLOR.bg.border}`,
        borderRadius: RADIUS.xl,
        padding: '20px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 핫 인디케이터 */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: COLOR.gradient.hot,
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 999,
          marginBottom: 10,
        }}
      >
        ⏭ 다음 글 · 이어서 읽기
      </div>

      {/* 카테고리 */}
      <div style={{ fontSize: 11, color: COLOR.text.tertiary, marginBottom: 6 }}>
        <span
          style={{
            background: COLOR.bg.raised,
            color: COLOR.neon.cyan,
            padding: '2px 8px',
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          {CAT_LABEL[post.category] || post.category}
        </span>
      </div>

      {/* 제목 */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          lineHeight: 1.35,
          color: COLOR.text.primary,
          margin: '6px 0 12px',
          letterSpacing: '-0.01em',
        }}
      >
        {post.title}
      </h2>

      {/* 본문 (펼침 / 미리보기) */}
      <div
        style={{
          fontSize: 15,
          color: COLOR.text.secondary,
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {showFull ? text : previewText}
      </div>

      {/* 펼치기 버튼 */}
      {!showFull && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px 16px',
            background: COLOR.gradient.hot,
            color: '#fff',
            border: 'none',
            borderRadius: RADIUS.md,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 48,
          }}
        >
          이어서 읽기 →
        </button>
      )}

      {/* 펼친 후 메타 + 다음다음글 이동 버튼 */}
      {showFull && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${COLOR.bg.border}`,
            display: 'flex',
            gap: 12,
            fontSize: 13,
            color: COLOR.text.tertiary,
            alignItems: 'center',
          }}
        >
          <span>❤️ {post.likes}</span>
          <span>💬 {post.comment_count}</span>
          <button
            onClick={() => navigate(`/community/post/${post.id}`)}
            style={{
              marginLeft: 'auto',
              background: COLOR.neon.pink,
              color: '#fff',
              border: 'none',
              borderRadius: RADIUS.sm,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 36,
            }}
          >
            이 글 댓글 보기
          </button>
        </div>
      )}

      {/* 처음 카드 클릭 = 풀 페이지로 이동 (대안) */}
      {!showFull && (
        <Link
          to={`/community/post/${post.id}`}
          style={{
            display: 'block',
            marginTop: 8,
            fontSize: 12,
            color: COLOR.text.tertiary,
            textAlign: 'center',
            textDecoration: 'underline',
          }}
        >
          또는 이 글 페이지로 이동
        </Link>
      )}
    </section>
  );
}
