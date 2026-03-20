import { Link } from "react-router-dom";

const hotPosts = [
  { id: 101, title: "일산 밤문화 입문기 — 3개월 차 솔직 소감", author: "야행성루키", date: "2026-03-19", comments: 74 },
  { id: 102, title: "라운지 vs 나이트, 결국 취향 차이더라", author: "취향존중", date: "2026-03-18", comments: 61 },
  { id: 103, title: "혼자 다니는 분들 의외로 많더라고요", author: "솔로탐험가", date: "2026-03-17", comments: 53 },
];

const recentPosts = [
  { id: 1, title: "주엽역 근처 분위기 좋은 곳 알려주세요", author: "주엽사람", date: "2026-03-20", comments: 8 },
  { id: 2, title: "금요일 vs 토요일, 언제가 더 나을까요?", author: "요일고민", date: "2026-03-20", comments: 23 },
  { id: 3, title: "라페스타 쪽 새로 생긴 바 가보신 분?", author: "신상궁금", date: "2026-03-19", comments: 15 },
  { id: 4, title: "회식 장소로 괜찮은 곳 추천 부탁드립니다", author: "직장인모임", date: "2026-03-19", comments: 31 },
  { id: 5, title: "여름 되면 루프탑 바 오픈하는 곳 있나요", author: "루프탑기대", date: "2026-03-18", comments: 12 },
  { id: 6, title: "대리운전 앱 뭐가 제일 빠른지 공유해요", author: "귀가전문", date: "2026-03-18", comments: 27 },
  { id: 7, title: "일산에서 칵테일 잘하는 곳 정보 공유", author: "칵테일러버", date: "2026-03-17", comments: 19 },
  { id: 8, title: "백석동 쪽 늦은 밤 갈 만한 곳?", author: "백석주민", date: "2026-03-17", comments: 6 },
  { id: 9, title: "주말 나이트 예약 필수인가요?", author: "예약궁금", date: "2026-03-16", comments: 14 },
  { id: 10, title: "비 오는 날 실내 놀거리 추천", author: "우중산책", date: "2026-03-16", comments: 9 },
];

export default function FreeBoardPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">잡담 광장</h1>
            <p className="mt-2 text-neon-text-muted">
              주제 제한 없이 편하게 수다 떠는 곳
            </p>
          </div>
          <button className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light">
            글쓰기
          </button>
        </div>

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

        {/* Recent Posts — simple forum table */}
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
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                  page === 1
                    ? "bg-neon-primary text-neon-text"
                    : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
