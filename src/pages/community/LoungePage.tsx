import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { LOUNGE_DEFS, fetchLoungePosts, createLoungePost, type LoungeType, type LoungePost } from '@/lib/lounge-api';
import UserLevelCard from '@/components/community/UserLevelCard';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function LoungePage() {
  const { type } = useParams<{ type: string }>();
  const loungeType = (type as LoungeType) || 'free';
  const loungeDef = LOUNGE_DEFS.find(d => d.type === loungeType) || LOUNGE_DEFS[6];
  const { user } = useAuth();

  const richDescByType: Record<string, string> = {
    night: '강남 부산 수원 일산 나이트 다녀온 사람들의 실시간 이야기. 부킹 성공기, 부스 분위기, 매니저 평판, 양주 라인업 비교까지. 솔직 후기와 질문이 오가는 나이트 전용 게시판.',
    club: '강남 홍대 이태원 일산 클럽 음악·DJ·분위기·게스트 라인업 추천 정보. EDM 힙합 테크노 장르별 추천, 입장 줄 짧은 시간대, 친구와 가는 코스 등 클럽 다니는 사람들의 전용 게시판.',
    room: '일산 강남 수원 부산 룸 이용 후기와 추천 정보. 4인 소형부터 30인 단체석까지 인원별 사이즈, 발렌타인 조니워커 양주 라인업, 매니저 평판, 예약 팁 공유.',
    yojung: '전통 요정 방문 경험과 정보 공유. 정찬 15첩 코스, 국악 라이브, 비즈니스 만찬 후기. 일산명월관·종로요정·강남요정 등 코스 구성, 드레스코드, 예약 매너까지.',
    hoppa: '여성 전용 사교 공간 호빠 방문 후기·추천. 강남 종로 영등포 분위기, 매니저 평판, 첫방문 동선, 안전 정보까지. 여자 혼자 가도 안전한 호빠 정보 나누는 전용 게시판.',
    lounge: '강남 홍대 이태원 일산 라운지바 분위기·칵테일·위스키 추천 게시판. 데이트 코스, 접대용 라운지, 야경 좋은 루프탑·호텔 라운지 후기. 무드별 추천 공유.',
    free: '업종 상관없이 자유롭게 대화하는 라운지 공간. 잡담, 질문, 황당썰, 후기, 추천, 푸념까지 익명으로 OK. 나이트라이프 회원들이 모여 떠드는 광장.',
    qna: '나이트라이프 관련 궁금한 거 다 답해주는 Q&A 게시판. 첫방문 매너, 무드 비교, 업소 추천, 안전 팁, 드레스코드까지. 단골 회원들이 빠르게 답변해주는 실시간 질문방.',
  };
  useDocumentMeta(
    `${loungeDef.name} — ${loungeDef.desc}`,
    richDescByType[loungeType] || `${loungeDef.name}에서 실제 경험담과 정보를 나눠보세요. 솔직한 이야기가 오가는 곳.`
  );

  const [posts, setPosts] = useState<LoungePost[]>([]);
  const [total, setTotal] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    // 진짜 DB 글만 — 가짜 시드 0
    const { data, count } = await fetchLoungePosts(loungeType);
    setPosts(data);
    setTotal(count);
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loungeType]);

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newContent.trim()) { setError('제목과 내용을 입력해주세요'); return; }
    setSubmitting(true);
    setError('');
    const result = await createLoungePost({ lounge_type: loungeType, title: newTitle.trim(), content: newContent.trim() });
    setSubmitting(false);
    if (result.error) { setError(result.error); }
    else { setNewTitle(''); setNewContent(''); setShowWrite(false); loadPosts(); }
  };

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">

        {/* 라운지 네비 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {LOUNGE_DEFS.map(d => (
            <Link
              key={d.type}
              to={d.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                d.type === loungeType
                  ? 'bg-violet-600 text-white'
                  : 'bg-neon-surface-2 text-neon-text-muted hover:bg-violet-500/20 hover:text-violet-400'
              }`}
            >
              {d.icon} {d.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메인 컨텐츠 */}
          <div className="flex-1">
            {/* 헤더 */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black" style={{ color: '#111' }}>
                  {loungeDef.icon} {loungeDef.name}
                </h1>
                <p className="text-sm text-neon-text-muted mt-1">{total}개의 글</p>
              </div>
              <button
                onClick={() => setShowWrite(!showWrite)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 transition"
              >
                {showWrite ? '닫기' : '글쓰기'}
              </button>
            </div>

            {/* 글쓰기 폼 */}
            {showWrite && (
              <div className="mb-5 rounded-xl border border-neon-border bg-neon-surface/50 p-5">
                {user ? (
                  <>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="제목을 입력하세요"
                      maxLength={60}
                      className="w-full mb-3 rounded-lg border border-neon-border bg-neon-bg px-3 py-2.5 text-sm text-neon-text placeholder:text-neon-text-muted/50 focus:border-violet-500 focus:outline-none"
                    />
                    <textarea
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      placeholder="내용을 작성하세요..."
                      rows={4}
                      maxLength={3000}
                      className="w-full mb-3 rounded-lg border border-neon-border bg-neon-bg px-3 py-2.5 text-sm text-neon-text placeholder:text-neon-text-muted/50 focus:border-violet-500 focus:outline-none resize-none"
                    />
                    {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition"
                    >
                      {submitting ? '작성 중...' : '등록'}
                    </button>
                  </>
                ) : (
                  <p className="text-center text-sm text-neon-text-muted">
                    <a href="/login" className="text-violet-400 hover:underline">로그인</a> 후 글 작성 가능
                  </p>
                )}
              </div>
            )}

            {/* 글 목록 */}
            <div className="space-y-3">
              {posts.map(post => {
                const nickname = post.user_profiles?.nickname || '익명';
                return (
                  <div key={post.id} className="rounded-xl border border-neon-border bg-neon-surface/50 p-4 hover:border-violet-500/30 transition cursor-pointer">
                    <h3 className="text-sm font-bold text-neon-text mb-1 line-clamp-1">{post.title}</h3>
                    <p className="text-xs text-neon-text-muted line-clamp-2 leading-relaxed mb-2">{post.content}</p>
                    <div className="flex items-center gap-3 text-xs text-neon-text-muted">
                      <span>{nickname}</span>
                      <span>{timeAgo(post.created_at)}</span>
                      <span>👁 {post.view_count}</span>
                      <span>👍 {post.upvote_count}</span>
                      <span>💬 {post.comment_count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {posts.length === 0 && (
              <div className="rounded-xl border border-neon-border p-8 text-center">
                <p className="text-2xl mb-2">🤫</p>
                <p className="text-sm text-neon-text-muted">아직 글이 없어요. 첫 번째 글을 작성해보세요!</p>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="w-full lg:w-72 space-y-4">
            <UserLevelCard />

            {/* 다른 라운지 */}
            <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-4">
              <h3 className="text-sm font-bold text-neon-text mb-3">다른 라운지</h3>
              <div className="space-y-2">
                {LOUNGE_DEFS.filter(d => d.type !== loungeType).slice(0, 5).map(d => (
                  <Link
                    key={d.type}
                    to={d.href}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neon-text-muted hover:bg-neon-surface-2 hover:text-neon-text transition"
                  >
                    <span>{d.icon}</span>
                    <span>{d.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
