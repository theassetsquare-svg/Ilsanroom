import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { useEngagementStore } from '@/lib/engagement-store';

const sampleHotPosts = [
  { id: "hot-1", title: "일산 밤문화 입문기 — 3개월 차 솔직 소감", author: "야행성루키", date: "2026-03-19", comments: 74 },
  { id: "hot-2", title: "라운지 vs 나이트, 결국 취향 차이더라", author: "취향존중", date: "2026-03-18", comments: 61 },
  { id: "hot-3", title: "혼자 다니는 분들 의외로 많더라고요", author: "솔로탐험가", date: "2026-03-17", comments: 53 },
];

const sampleRecentPosts = [
  { id: "sample-1", title: "주엽역 근처 분위기 좋은 곳 알려주세요", author: "주엽사람", date: "2026-03-20", comments: 8 },
  { id: "sample-2", title: "금요일 vs 토요일, 언제가 더 나을까요?", author: "요일고민", date: "2026-03-20", comments: 23 },
  { id: "sample-3", title: "라페스타 쪽 새로 생긴 바 가보신 분?", author: "신상궁금", date: "2026-03-19", comments: 15 },
  { id: "sample-4", title: "회식 장소로 괜찮은 곳 추천 부탁드립니다", author: "직장인모임", date: "2026-03-19", comments: 31 },
  { id: "sample-5", title: "여름 되면 루프탑 바 오픈하는 곳 있나요", author: "루프탑기대", date: "2026-03-18", comments: 12 },
  { id: "sample-6", title: "대리운전 앱 뭐가 제일 빠른지 공유해요", author: "귀가전문", date: "2026-03-18", comments: 27 },
  { id: "sample-7", title: "일산에서 칵테일 잘하는 곳 정보 공유", author: "칵테일러버", date: "2026-03-17", comments: 19 },
  { id: "sample-8", title: "백석동 쪽 늦은 밤 갈 만한 곳?", author: "백석주민", date: "2026-03-17", comments: 6 },
  { id: "sample-9", title: "주말 나이트 예약 필수인가요?", author: "예약궁금", date: "2026-03-16", comments: 14 },
  { id: "sample-10", title: "비 오는 날 실내 놀거리 추천", author: "우중산책", date: "2026-03-16", comments: 9 },
];

interface SimplePost {
  id: string;
  title: string;
  author: string;
  date: string;
  comments: number;
}

function postToSimple(post: Post): SimplePost {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    date: post.created_at.slice(0, 10),
    comments: post.comment_count || 0,
  };
}

export default function FreeBoardPage() {
  useDocumentMeta('아무 말 대잔치, 자유게시판', '잡담, 궁금한 거, 웃긴 얘기 다 OK. 규칙만 지키면 뭐든 써.');
  const { user } = useAuth();
  const [recentPosts, setRecentPosts] = useState<SimplePost[]>(sampleRecentPosts);
  const [hotPosts, setHotPosts] = useState<SimplePost[]>(sampleHotPosts);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const postsPerPage = 10;

  const loadPosts = async (page: number) => {
    setLoading(true);
    const offset = (page - 1) * postsPerPage;
    const { data, count } = await fetchPosts('free', postsPerPage, offset);
    if (data.length > 0) {
      setRecentPosts(data.map(postToSimple));
      setTotalCount(count);
      // Use top 3 by views/likes as hot posts
      const sorted = [...data].sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
      if (sorted.length >= 3) {
        setHotPosts(sorted.slice(0, 3).map(postToSimple));
      }
    } else {
      setTotalCount(sampleRecentPosts.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts(currentPage);
  }, [currentPage]);

  const points = useEngagementStore((s) => s.points);
  const [pointAlert, setPointAlert] = useState(false);

  const handleWriteClick = () => {
    if (!user) {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 3000);
      return;
    }
    if (points < 300) {
      setPointAlert(true);
      setTimeout(() => setPointAlert(false), 4000);
      return;
    }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({
      category: 'free',
      title: writeTitle,
      content: writeContent,
    });
    if (!result.error) {
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteContent("");
      setCurrentPage(1);
      await loadPosts(1);
    }
    setSubmitting(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / postsPerPage));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">잡담 광장</h1>
            <p className="mt-2 text-neon-text-muted">
              주제 제한 없이 편하게 수다 떠는 곳
            </p>
          </div>
          <button
            onClick={handleWriteClick}
            className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light"
          >
            글쓰기
          </button>
        </div>

        {/* Auth Error Toast */}
        {authError && (
          <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/10 px-5 py-3 text-sm text-neon-red">
            로그인이 필요합니다
          </div>
        )}
        {pointAlert && (
          <div className="mb-4 rounded-xl px-5 py-3 text-sm" style={{ backgroundColor: '#F8F7FF', border: '1px solid #C4B5FD', color: '#6B21A8' }}>
            🔒 글쓰기는 🔥매니아(300P) 등급부터 가능합니다. 현재 {points}P — {300 - points}P 더 모으면 해금!
          </div>
        )}

        {/* Hot Posts */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">🔥</span> 인기글
          </h2>
          <div className="space-y-1 rounded-xl border border-neon-gold/30 bg-neon-surface overflow-hidden">
            {hotPosts.map((post, i) => (
              <div
                key={post.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  i !== hotPosts.length - 1 ? "border-b border-neon-border/50" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm">🔥</span>
                  <span className="truncate text-sm font-semibold">{post.title}</span>
                </div>
                <span className="shrink-0 ml-3 text-xs text-neon-gold">[{post.comments}]</span>
              </div>
            ))}
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            불러오는 중...
          </div>
        )}

        {/* Recent Posts — simple forum table */}
        {!loading && (
          <section>
            <h2 className="mb-4 text-lg font-bold">최근 글</h2>
            <div className="overflow-hidden rounded-xl border border-neon-border">
              {recentPosts.map((post, i) => (
                <div
                  key={post.id}
                  className={`flex items-center justify-between px-5 py-3.5 transition hover:bg-neon-surface ${
                    i !== recentPosts.length - 1 ? "border-b border-neon-border/50" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-sm">
                      {post.title}
                      {post.comments > 0 && (
                        <span className="ml-2 text-xs text-neon-primary-light">[{post.comments}]</span>
                      )}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-4 ml-4 text-xs text-neon-text-muted">
                    <span>{post.author}</span>
                    <span>{post.date.slice(5)}</span>
                  </div>
                </div>
              ))}

              {recentPosts.length === 0 && (
                <div className="px-5 py-12 text-center text-neon-text-muted">
                  아직 게시글이 없습니다
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                    page === currentPage
                      ? "bg-neon-primary text-neon-text"
                      : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Write Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-neon-border bg-neon-surface p-6">
              <h2 className="mb-4 text-lg font-bold">글쓰기</h2>
              <div className="mb-3">
                <label className="mb-1 block text-xs text-neon-text-muted">제목</label>
                <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="제목을 입력하세요"
                  className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary" />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs text-neon-text-muted">내용</label>
                <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="자유롭게 작성해주세요" rows={5}
                  className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowWriteModal(false)} className="rounded-lg px-4 py-2 text-sm text-neon-text-muted hover:bg-neon-surface-2">취소</button>
                <button onClick={handleSubmit} disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
                  className="rounded-lg bg-neon-primary px-5 py-2 text-sm font-medium transition hover:bg-neon-primary-light disabled:opacity-50">
                  {submitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
