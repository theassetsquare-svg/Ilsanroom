import { useState, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase';

/* ── 시간대 기반 자연스러운 숫자 ── */
function getTimeMult(): number {
  const h = new Date().getHours();
  if (h >= 22 || h < 3) return 1.6;
  if (h >= 20) return 1.3;
  if (h >= 15) return 0.9;
  if (h >= 10) return 0.6;
  return 0.4;
}

/* ── 시드 인기글 ── */
const SEED_HOT_POSTS = [
  { id: 'h1', title: '강남 레이스 금요일 다녀온 솔직후기', category: '후기', likes: 47, comments: 23 },
  { id: 'h2', title: '택시비가 술값보다 나온 사람 나만??', category: '자유', likes: 38, comments: 19 },
  { id: 'h3', title: '평일에 가야 자리 잡는 이유 3가지', category: '팁', likes: 34, comments: 11 },
  { id: 'h4', title: '수원찬스돔 부킹 솔직후기', category: '후기', likes: 31, comments: 15 },
  { id: 'h5', title: '토요일 강남 같이 갈 사람 2명 구함', category: '모집', likes: 22, comments: 8 },
  { id: 'h6', title: '호빠 혼자 가면 진짜 괜찮음??', category: 'Q&A', likes: 19, comments: 27 },
  { id: 'h7', title: '어젯밤 일 아직도 생각나서 씀', category: '자유', likes: 28, comments: 14 },
  { id: 'h8', title: '일산명월관 접대 갔는데 거래처가 감동', category: '후기', likes: 41, comments: 9 },
  { id: 'h9', title: '나이트 드레스코드 진짜 기준이 뭐야', category: 'Q&A', likes: 16, comments: 21 },
  { id: 'h10', title: '홍대 버뮤다 vs 청담 사운드, 승자는?', category: '자유', likes: 33, comments: 17 },
];

const SEED_RECENT_REVIEWS = [
  { venue: '강남클럽 레이스', rating: 5, excerpt: '사운드 미쳤다, 재방문 확정', time: '23분 전' },
  { venue: '수원찬스돔나이트', rating: 4, excerpt: '부킹 잘 되고 실장님 센스 좋음', time: '1시간 전' },
  { venue: '일산명월관요정', rating: 5, excerpt: '접대 자리로 최고, 거래처 만족', time: '2시간 전' },
  { venue: '강남호빠 로얄', rating: 4, excerpt: '여자끼리 가기 좋은 곳', time: '3시간 전' },
  { venue: '홍대클럽 버뮤다', rating: 5, excerpt: 'EDM 좋아하면 무조건 여기', time: '4시간 전' },
];

const SEED_ACTIVE_USERS = [
  '강남불주먹', '홍대댄싱퀸', '수원밤도깨비', '클럽요정', '나이트올빼미',
  '라운지고양이', '금요일중독', '부스VIP', '분위기메이커', '택시비파산',
];

const LiveActivity = memo(function LiveActivity() {
  const [viewers, setViewers] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const [todayPosts, setTodayPosts] = useState(0);
  const [hotPosts, setHotPosts] = useState(SEED_HOT_POSTS);
  const [recentReviews, setRecentReviews] = useState(SEED_RECENT_REVIEWS);
  const [weeklyTopUser, setWeeklyTopUser] = useState('강남불주먹');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mult = getTimeMult();
    setViewers(Math.floor(127 * mult) + Math.floor(Math.random() * 40));
    setTodayReviews(Math.floor(12 * mult) + Math.floor(Math.random() * 8));
    setTodayPosts(Math.floor(34 * mult) + Math.floor(Math.random() * 15));

    // DB에서 실제 인기글 가져오기 시도
    const supabase = createClient();
    if (supabase) {
      supabase.from('posts')
        .select('id, title, category, likes, comment_count')
        .order('likes', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data && data.length >= 3) {
            setHotPosts(data.map(d => ({
              id: d.id,
              title: d.title,
              category: d.category,
              likes: d.likes,
              comments: d.comment_count || 0,
            })));
          }
        });
    }

    timerRef.current = setInterval(() => {
      setViewers(prev => Math.max(10, prev + Math.floor(Math.random() * 7) - 3));
    }, 10000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const catColor: Record<string, string> = {
    '후기': 'bg-amber-500/20 text-amber-500',
    '자유': 'bg-blue-500/20 text-blue-500',
    '팁': 'bg-emerald-500/20 text-emerald-500',
    '모집': 'bg-violet-500/20 text-violet-500',
    'Q&A': 'bg-rose-500/20 text-rose-500',
    reviews: 'bg-amber-500/20 text-amber-500',
    free: 'bg-blue-500/20 text-blue-500',
    tips: 'bg-emerald-500/20 text-emerald-500',
    party: 'bg-violet-500/20 text-violet-500',
    discussion: 'bg-rose-500/20 text-rose-500',
  };

  return (
    <div className="space-y-5">
      {/* 실시간 현황 카드 */}
      <div className="rounded-xl border border-neon-primary/30 p-5"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(16,185,129,0.04))' }}>
        <h2 className="text-lg font-bold text-neon-text mb-4 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          실시간 현황
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-neon-surface-2 p-3 text-center">
            <div className="text-2xl font-black text-emerald-500">{viewers}</div>
            <div className="text-xs text-neon-text-muted mt-0.5">접속 중</div>
          </div>
          <div className="rounded-lg bg-neon-surface-2 p-3 text-center">
            <div className="text-2xl font-black text-amber-500">{todayReviews}</div>
            <div className="text-xs text-neon-text-muted mt-0.5">오늘 후기</div>
          </div>
          <div className="rounded-lg bg-neon-surface-2 p-3 text-center">
            <div className="text-2xl font-black text-violet-500">{todayPosts}</div>
            <div className="text-xs text-neon-text-muted mt-0.5">오늘 게시글</div>
          </div>
        </div>
      </div>

      {/* 인기글 TOP 10 */}
      <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5">
        <h3 className="text-sm font-bold text-neon-text mb-3 flex items-center gap-2">
          🔥 오늘의 인기 글 TOP 10
        </h3>
        <div className="space-y-2">
          {hotPosts.slice(0, 10).map((post, i) => (
            <Link
              key={post.id}
              to={post.id.startsWith('seed') ? '/community' : `/community/post/${post.id}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neon-surface-2 transition group"
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                i < 3 ? 'bg-amber-500/20 text-amber-500' : 'bg-neon-surface-2 text-neon-text-muted'
              }`}>{i + 1}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${catColor[post.category] || 'bg-neutral-100 text-neutral-500'}`}>
                {post.category}
              </span>
              <span className="flex-1 text-sm text-neon-text-muted group-hover:text-neon-text transition line-clamp-1">{post.title}</span>
              <span className="text-[10px] text-neon-text-muted">👍{post.likes}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 방금 새 후기 */}
      <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5">
        <h3 className="text-sm font-bold text-neon-text mb-3 flex items-center gap-2">
          ⭐ 최근 후기
        </h3>
        <div className="space-y-3">
          {recentReviews.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex gap-0.5 mt-0.5">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className={`h-3 w-3 ${s <= r.rating ? 'text-amber-400' : 'text-neutral-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neon-text">{r.venue}</div>
                <p className="text-xs text-neon-text-muted line-clamp-1">{r.excerpt}</p>
              </div>
              <span className="text-[10px] text-neon-text-muted whitespace-nowrap">{r.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 이번 주 활동왕 */}
      <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5">
        <h3 className="text-sm font-bold text-neon-text mb-3">🏆 이번 주 활동왕</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-lg">👑</div>
          <div>
            <div className="text-sm font-bold text-neon-text">{weeklyTopUser}</div>
            <div className="text-xs text-neon-text-muted">후기 12개 · 댓글 34개</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SEED_ACTIVE_USERS.slice(1, 6).map((name, i) => (
            <span key={i} className="rounded-full bg-neon-surface-2 px-2 py-0.5 text-[10px] text-neon-text-muted">
              {i + 2}위 {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default LiveActivity;
