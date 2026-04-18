import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { PageLiveCounter } from '@/components/ui/LiveStats';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

interface StylePost {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  likes: number;
  date: string;
}

function postToStyle(post: Post): StylePost {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    excerpt: post.content.length > 80 ? post.content.slice(0, 80) + "…" : post.content,
    likes: post.likes,
    date: post.created_at.slice(0, 10),
  };
}

/* 업종별 드레스코드 가이드 — 정적 콘텐츠로 첫 화면 임팩트 */
const DRESS_GUIDE = [
  { type: '클럽', ok: '깔끔한 셔츠, 슬랙스, 구두/운동화(깨끗한 것)', ng: '슬리퍼, 반바지, 트레이닝복', color: '#8B5CF6' },
  { type: '라운지', ok: '스마트 캐주얼, 깔끔한 원피스/재킷', ng: '후드티, 찢어진 청바지, 모자', color: '#10B981' },
  { type: '나이트', ok: '정장 또는 세미정장, 구두 필수', ng: '운동화, 청바지, 반팔티', color: '#F59E0B' },
  { type: '요정', ok: '깔끔한 사복 OK, 편안한 복장 가능', ng: '지나치게 캐주얼한 복장', color: '#EC4899' },
];

export default function FashionPage() {
  useDocumentMeta('운동화 신고 가도 돼? 업종별 복장 가이드', '클럽·나이트·요정·라운지, 어디냐에 따라 옷이 다르다. 한눈에 정리.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<StylePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('tips');
      setPosts(data.map(postToStyle));
      setLoading(false);
    })();
  }, []);

  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({ category: 'tips', title: writeTitle, content: writeContent });
    if (result.error) { setSubmitting(false); return; } else {
      setShowWriteModal(false); setWriteTitle(""); setWriteContent("");
      const { data } = await fetchPosts('tips');
      setPosts(data.map(postToStyle));
    }
    setSubmitting(false);
  };

  // 인기 스타일 글
  const hotPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="mb-8">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">스타일 갤러리</h1>
              <p className="mt-2 text-sm font-bold" style={{ color: '#8B5CF6' }}>
                "입구에서 막힌 적 있으면 여기부터 읽어"
              </p>
              <div className="mt-2"><PageLiveCounter pageName="스타일 보는 중" baseCount={19} /></div>
            </div>
            <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>글쓰기</button>
          </div>
        </div>

        {/* 업종별 드레스코드 가이드 — 첫 화면에서 바로 유용한 정보 */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {DRESS_GUIDE.map((g) => (
            <div key={g.type} className="rounded-xl border p-4" style={{ borderColor: g.color + '30', backgroundColor: g.color + '08' }}>
              <h3 className="text-sm font-black mb-2" style={{ color: g.color }}>{g.type} 드레스코드</h3>
              <div className="space-y-1">
                <p className="text-xs leading-relaxed" style={{ color: '#333' }}>
                  <span className="font-bold" style={{ color: '#10B981' }}>OK</span> {g.ok}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#333' }}>
                  <span className="font-bold" style={{ color: '#EF4444' }}>NG</span> {g.ng}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 인기 스타일 글 */}
        {!loading && hotPosts.length > 0 && (
          <div className="mb-6 rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.04)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">👔</span>
              <h2 className="text-sm font-black" style={{ color: '#111' }}>지금 뜨는 스타일 글</h2>
            </div>
            <div className="space-y-2">
              {hotPosts.map((p, idx) => (
                <button key={p.id} onClick={() => navigate('/community/post/' + p.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white"
                  style={{ minHeight: 44 }}>
                  <span className="text-sm font-black shrink-0" style={{ color: idx === 0 ? '#EF4444' : '#F59E0B', width: 20 }}>{idx + 1}</span>
                  <span className="text-sm font-medium truncate flex-1" style={{ color: '#111' }}>{p.title}</span>
                  <span className="text-xs shrink-0" style={{ color: '#999' }}>♥{p.likes}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">불러오는 중...</div>
        )}

        {!loading && posts.length > 0 && (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {posts.map((post) => (
              <button key={post.id} onClick={() => navigate('/community/post/' + post.id)}
                className="mb-5 break-inside-avoid w-full text-left rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/40"
                style={{ minHeight: 48 }}>
                <h3 className="mb-2 text-sm font-bold leading-snug">{post.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-neon-text-muted">{post.excerpt}</p>
                <div className="flex items-center justify-between border-t border-neon-border pt-3 text-xs text-neon-text-muted">
                  <span>{post.author} · {post.date}</span>
                  <span>♥ {post.likes}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            아직 스타일 글이 없습니다. 나만의 코디를 공유해보세요!
          </div>
        )}

        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <WriteHeader onCancel={() => setShowWriteModal(false)} title="스타일 공유" />
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="제목 (예: 클럽 갈 때 추천 코디)"
                className="w-full rounded-lg border px-4 py-3 text-sm mb-3 outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: '#999' }}>에디터 로딩 중...</div>}>
                <RichTextEditor value={writeContent} onChange={setWriteContent} placeholder="스타일 팁을 공유해주세요. 이미지/동영상 첨부 가능!" minHeight={300} />
              </Suspense>
            </div>
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <button onClick={handleSubmit} disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
                className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
                style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 56 }}>
                {submitting ? "등록 중..." : "글 저장"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
