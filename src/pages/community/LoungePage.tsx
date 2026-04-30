import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

/* ── 시드 데이터 (DB 비어있을 때 살아있는 느낌) ── */
function getSeedPosts(type: LoungeType): LoungePost[] {
  const seedMap: Record<string, { title: string; content: string; nickname: string }[]> = {
    night: [
      { title: '수원찬스돔 주말 분위기 실화?', content: '어제 토요일에 갔는데 12시 넘으니까 부킹 미쳤음. 실장님이 알아서 자리 잡아주는데 센스가 장난 아님. 사운드도 새로 바꿨는지 체감이 다름.', nickname: '수원밤도깨비' },
      { title: '성남샴푸 처음 가봤는데 솔직후기', content: '친구가 추천해서 갔는데 생각보다 넓고 사람도 많았음. 금요일이라 그런지 분위기 괜찮았고 음료 가격도 나이트치곤 합리적이었음.', nickname: '성남첫방문' },
      { title: '나이트 혼자 가본 사람 있어?', content: '혼자 가면 좀 그런가 싶은데 부킹 잘 되는 곳이면 혼자가도 괜찮다는 얘기 들었거든. 경험자 후기 좀 부탁합니다.', nickname: '솔로댄서77' },
    ],
    club: [
      { title: '강남 레이스 금요일 셋리스트 미쳤다', content: 'DJ가 바뀌었나? 어제 금요일 셋이 역대급이었음. EDM 좋아하면 무조건 가야함. 사운드 시스템도 업그레이드 된 느낌.', nickname: '강남불주먹' },
      { title: '홍대 버뮤다 vs 청담 사운드 비교', content: '두 군데 다 자주 가는데 분위기가 확실히 다름. 버뮤다는 자유롭고 신나는 느낌, 사운드는 프리미엄 분위기. 취향 따라 갈리는듯.', nickname: '클럽투어러' },
    ],
    room: [
      { title: '일산룸 접대 자리로 괜찮을까?', content: '거래처 접대 자리인데 일산 쪽에서 찾고 있습니다. 프라이빗하면서 분위기 좋은 곳 추천해주세요.', nickname: '직장인밤문화' },
      { title: '강남룸 초이스 시스템 궁금', content: '처음 가보려는데 초이스가 어떻게 진행되는지 궁금합니다. 후기 보면 다들 만족한다는데 실제로 어떤지 알려주세요.', nickname: '룸초보자' },
    ],
    yojung: [
      { title: '일산명월관 솔직 후기 남김', content: '접대 자리로 갔는데 거래처분이 엄청 만족하셨음. 한복 입은 매니저분들 서비스가 격이 다르고, 양주 구성도 좋았음. 재방문 의사 100%.', nickname: '접대의신' },
    ],
    hoppa: [
      { title: '강남호빠 로얄 여자 혼자 가봄', content: '친구 약속 펑크나서 혼자 갔는데 오히려 더 재밌었음ㅋㅋ 매니저들이 재미있게 해주고, 분위기 편안해서 스트레스 확 풀림.', nickname: '호빠여왕' },
      { title: '호빠 처음인데 뭘 준비해야 해?', content: '친구들이랑 3명이서 가려는데 복장이나 예산 같은 거 기본 상식 좀 알려주세요. 완전 첫방문이라 아무것도 모름.', nickname: '호빠궁금해' },
    ],
    lounge: [
      { title: '압구정 디엠 라운지 칵테일 추천', content: '여기 시그니처 칵테일 진짜 잘 만듦. 특히 로즈마리 넣은 건 여기서만 마실 수 있는 맛. 분위기도 조용하고 대화하기 좋음.', nickname: '칵테일감별사' },
    ],
    free: [
      { title: '어젯밤 택시비가 술값보다 나왔다', content: '강남에서 일산까지 택시비가 6만원ㅋㅋ 술값은 5만원이었는데 택시비가 더 나오는 아이러니. 다음엔 대리 부를듯.', nickname: '택시비폭탄' },
      { title: '금요일 밤 루틴 공유', content: '퇴근 → 집에서 샤워 → 친구 만나서 저녁 → 10시쯤 출발 → 새벽 2시 귀가. 이게 최적의 루틴인 것 같다.', nickname: '금요일전사' },
    ],
    qna: [
      { title: '나이트 드레스코드 어디까지 괜찮아?', content: '반바지+슬리퍼는 안 되는 건 아는데, 청바지+스니커즈는 되나요? 장소마다 다를 것 같긴 한데 보통 기준이 궁금합니다.', nickname: '패션고민러' },
      { title: '부킹이 정확히 뭔가요?', content: '나이트 처음 가보려는데 부킹 시스템이 어떻게 되는지 궁금합니다. 자연스럽게 되는 건가요 아니면 신청하는 건가요?', nickname: '완전초보' },
    ],
  };
  const posts = seedMap[type] || seedMap.free;
  const now = Date.now();
  return posts.map((p, i) => ({
    id: `seed-${type}-${i}`,
    user_id: null,
    lounge_type: type,
    title: p.title,
    content: p.content,
    images: [],
    view_count: Math.floor(Math.random() * 200) + 20,
    upvote_count: Math.floor(Math.random() * 30) + 1,
    comment_count: Math.floor(Math.random() * 15) + 1,
    status: 'active',
    created_at: new Date(now - (i + 1) * 3600000 * (Math.random() * 3 + 1)).toISOString(),
    user_profiles: { nickname: p.nickname, avatar_url: null, level: ['newbie', 'regular', 'loyal'][Math.floor(Math.random() * 3)] },
  }));
}

export default function LoungePage() {
  const { type } = useParams<{ type: string }>();
  const loungeType = (type as LoungeType) || 'free';
  const loungeDef = LOUNGE_DEFS.find(d => d.type === loungeType) || LOUNGE_DEFS[6];
  const { user } = useAuth();

  useDocumentMeta(
    `${loungeDef.name} — ${loungeDef.desc}`,
    `${loungeDef.name}에서 실제 경험담과 정보를 나눠보세요. 솔직한 이야기가 오가는 곳.`
  );

  const [posts, setPosts] = useState<LoungePost[]>([]);
  const [total, setTotal] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    const { data, count } = await fetchLoungePosts(loungeType);
    if (data.length > 0) {
      setPosts(data);
      setTotal(count);
    } else {
      // 시드 데이터
      const seed = getSeedPosts(loungeType);
      setPosts(seed);
      setTotal(seed.length);
    }
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
