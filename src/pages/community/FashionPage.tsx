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

  // 'tips' 카테고리에서 패션 관련 글을 가져옴 (별도 카테고리가 없으므로)
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

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">스타일 갤러리</h1>
              <p className="mt-2 text-neon-text-muted">장소 유형에 맞는 착장 영감을 얻고, 나만의 스타일을 공유하세요</p>
              <div className="mt-2"><PageLiveCounter pageName="스타일 보는 중" baseCount={19} /></div>
            </div>
            <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>글쓰기</button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">불러오는 중...</div>
        )}

        {!loading && posts.length > 0 && (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {posts.map((post) => (
              <button key={post.id} onClick={() => navigate('/community/post/' + post.id)}
                className="mb-5 break-inside-avoid w-full text-left rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/40">
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
