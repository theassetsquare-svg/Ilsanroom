import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, deletePost, deleteComment, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { PostListSkeleton } from '@/components/ui/Skeleton';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

type PartyStatus = "모집중" | "곧 마감" | "끝" | "신청 가능" | "자리 있음" | "완료" | "열린 모임" | "거의 찬 번개" | "종결";

const statusStyles: Record<PartyStatus, string> = {
  "모집중": "bg-neon-green/15 text-neon-green",
  "신청 가능": "bg-neon-green/15 text-neon-green",
  "자리 있음": "bg-neon-green/15 text-neon-green",
  "열린 모임": "bg-neon-green/15 text-neon-green",
  "거의 찬 번개": "bg-neon-gold/15 text-neon-gold",
  "곧 마감": "bg-neon-gold/15 text-neon-gold",
  "끝": "bg-neon-surface-2 text-neon-text-muted",
  "완료": "bg-neon-surface-2 text-neon-text-muted",
  "종결": "bg-neon-surface-2 text-neon-text-muted",
};

function getDday(dateStr: string): string {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

interface PartyItem {
  id: string;
  title: string;
  author: string;
  eventDate: string;
  region: string;
  currentMembers: number;
  maxMembers: number;
  ageRange: string;
  status: PartyStatus;
  comments: number;
  description: string;
}


function postToParty(post: Post): PartyItem {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    eventDate: post.created_at.slice(0, 10),
    region: "",
    currentMembers: 0,
    maxMembers: 0,
    ageRange: "",
    status: "모집중",
    comments: post.comment_count || 0,
    description: post.content.length > 100 ? post.content.slice(0, 100) + "…" : post.content,
  };
}

function NbbangCalc() {
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState("");
  const perPerson = total && people && Number(people) > 0 ? Math.ceil(Number(total) / Number(people)) : 0;

  return (
    <div className="mb-8 rounded-2xl border border-neon-accent/30 bg-neon-surface p-5">
      <h3 className="mb-3 text-sm font-bold text-neon-accent">N빵 계산기</h3>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">총 금액 (원)</label>
          <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="500000"
            className="w-32 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-accent"
            style={{ minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">인원</label>
          <input type="number" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="4"
            className="w-20 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-accent"
            style={{ minHeight: 44 }} />
        </div>
        <div className="text-sm">
          {perPerson > 0 && (
            <span className="font-bold text-neon-accent">1인당 {perPerson.toLocaleString()}원</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartyRecruitPage() {
  useDocumentMeta('같이 갈 사람 손! 파티 멤버 모집', '날짜 맞추고, 인원 채우고, N빵. 혼자 가기 아까울 때 여기서 구해.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<PartyStatus | "전체">("전체");
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('party');
      if (data.length > 0) {
        setParties(data.map(postToParty));
      }
      setLoading(false);
    })();
  }, []);

  const handleWriteClick = () => {
    if (!user) {
      window.location.href = '/login'; return;
    }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({
      category: 'party',
      title: writeTitle,
      content: writeContent,
    });
    if (result.error) { setSubmitting(false); return; } else {
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteContent("");
      const { data } = await fetchPosts('party');
      if (data.length > 0) {
        setParties(data.map(postToParty));
      }
    }
    setSubmitting(false);
  };

  // 시드 글 (DB 비어있을 때 사이트가 살아보이게)
  const seedPosts: PartyItem[] = [
    { id: 'seed-1', title: '금요일 강남 클럽 같이 갈 사람', author: '강남파티보이', eventDate: '2026-04-18', region: '강남', currentMembers: 3, maxMembers: 6, ageRange: '20대후반~30대초반', status: '모집중', comments: 8, description: '레이스 테이블 잡아놨는데 자리 여유 있어서 모집합니다. 엔빵이고 분위기 좋게 놀아요.' },
    { id: 'seed-2', title: '토요일 홍대 나이트 벙개 모집', author: '홍대놀자', eventDate: '2026-04-19', region: '홍대', currentMembers: 2, maxMembers: 4, ageRange: '20대', status: '모집중', comments: 12, description: '홍대 나이트 처음인 분도 환영. 분위기 좋게 부킹하면서 놀아봐요.' },
    { id: 'seed-3', title: '부산 해운대 주말 라운지 모임', author: '해운대서퍼', eventDate: '2026-04-19', region: '부산', currentMembers: 4, maxMembers: 8, ageRange: '25~35세', status: '신청 가능', comments: 5, description: '해운대 라운지에서 가볍게 한잔하면서 대화할 분들 모집. 남녀 비율 맞추고 싶어요.' },
    { id: 'seed-4', title: '일산 주말 벙개 2명 더', author: '일산밤문화', eventDate: '2026-04-19', region: '일산', currentMembers: 4, maxMembers: 6, ageRange: '30대', status: '곧 마감', comments: 6, description: '일산 나이트 갈 건데 2명 더 있으면 딱 좋을 것 같아서 모집합니다.' },
    { id: 'seed-5', title: '대구 동성로 금요일 파티', author: '대구밤왕', eventDate: '2026-04-18', region: '대구', currentMembers: 2, maxMembers: 5, ageRange: '20대~30대', status: '모집중', comments: 3, description: '동성로 클럽 가실 분. 분위기 좋고 음악 좋은 데로 갑시다.' },
  ];
  const displayParties = parties.length > 0 ? parties : seedPosts;

  const filtered = statusFilter === "전체"
    ? displayParties
    : displayParties.filter((p) => p.status === statusFilter);

  // 활발한 모임 (댓글 많은 순)
  const hotParties = [...displayParties].filter(p => p.status !== '끝' && p.status !== '종결' && p.status !== '완료')
    .sort((a, b) => b.comments - a.comments).slice(0, 3);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">파티모임</h1>
            <p className="mt-2 text-sm font-bold" style={{ color: '#8B5CF6' }}>
              "혼자 가기 심심할 때, 여기서 동행 구하면 끝"
            </p>
            <div className="mt-2"><PageLiveCounter pageName="모임 보는 중" baseCount={46} /></div>
          </div>
          <button
            onClick={handleWriteClick}
            className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light"
            style={{ minHeight: 44 }}
          >
            모집글 올리기
          </button>
        </div>

        {/* 지금 뜨는 모임 */}
        {!loading && hotParties.length > 0 && (
          <div className="mb-6 rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.04)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🎉</span>
              <h2 className="text-sm font-black" style={{ color: '#111' }}>지금 반응 뜨거운 모임</h2>
              <span className="text-[10px] rounded-full px-2 py-0.5 font-bold animate-pulse"
                style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>LIVE</span>
            </div>
            <div className="space-y-2">
              {hotParties.map((p) => (
                <button key={p.id} onClick={() => !p.id.startsWith('seed-') && navigate('/community/post/' + p.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white"
                  style={{ minHeight: 44 }}>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[p.status]}`}>{p.status}</span>
                  <span className="text-sm font-medium truncate flex-1" style={{ color: '#111' }}>{p.title}</span>
                  <span className="text-xs shrink-0" style={{ color: '#999' }}>💬{p.comments}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Auth Error Toast */}
        {authError && (
          <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/10 px-5 py-3 text-sm text-neon-red">
            로그인이 필요합니다
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {(["전체", "모집중", "신청 가능", "자리 있음", "열린 모임", "곧 마감", "끝", "완료", "종결"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition ${
                statusFilter === s
                  ? "bg-neon-primary text-neon-text"
                  : "border border-neon-border text-neon-text-muted hover:border-neon-primary/50"
              }`}
              style={{ minHeight: 36 }}
            >
              {s}
            </button>
          ))}
        </div>

        <NbbangCalc />

        {/* Loading */}
        {loading && (
          <PostListSkeleton />
        )}

        {/* Party Cards */}
        {!loading && (
          <div className="space-y-4">
            {filtered.map((party) => {
              const dday = getDday(party.eventDate);
              const fillPct = party.maxMembers > 0 ? Math.round((party.currentMembers / party.maxMembers) * 100) : 0;

              return (
                <div
                  key={party.id}
                  className="rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-primary/30"
                >
                  {/* Top Row: Date Badge + Status */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-neon-primary/20 px-3 py-1 text-sm font-bold text-neon-primary-light">
                        {dday}
                      </span>
                      <span className="text-xs text-neon-text-muted">{party.eventDate}</span>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[party.status] || "bg-neon-surface-2 text-neon-text-muted"}`}>
                      {party.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold">{party.title}</h3>
                  <p className="mb-4 text-sm text-neon-text-muted">{party.description}</p>

                  {/* Participant Bar */}
                  {party.maxMembers > 0 && (
                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-neon-text-muted">합류 현황</span>
                        <span className="font-medium">
                          {party.currentMembers}/{party.maxMembers}명
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-neon-surface-2">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            fillPct >= 100 ? "bg-neon-text-muted" : fillPct >= 75 ? "bg-neon-gold" : "bg-neon-green"
                          }`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Meta + Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-3 text-xs text-neon-text-muted">
                      {party.region && <span>{party.region}</span>}
                      {party.ageRange && <span>{party.ageRange}</span>}
                      <span>💬 {party.comments}</span>
                    </div>
                    {party.status !== "끝" && party.status !== "종결" && (
                      <button className="rounded-lg bg-neon-primary/20 px-4 py-1.5 text-xs font-medium text-neon-primary-light transition hover:bg-neon-primary/30"
                        style={{ minHeight: 36 }}>
                        합류 신청
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && statusFilter !== "전체" && (
              <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
                해당 상태의 모임이 없습니다. 다른 필터를 선택해보세요!
              </div>
            )}
          </div>
        )}

        {/* 다른 게시판 순환 */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="shrink-0 text-xs" style={{ color: '#999' }}>다른 게시판</span>
          {[
            { label: '💬 자유', href: '/community/free' },
            { label: '⭐ 후기', href: '/community/reviews' },
            { label: '🗺️ 오늘어디', href: '/community/qna' },
            { label: '🧩 조각모임', href: '/community/jogak' },
            { label: '💡 꿀팁', href: '/community/tips' },
            { label: '👗 패션', href: '/community/fashion' },
          ].map(b => (
            <Link key={b.label} to={b.href} className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:border-[#8B5CF6]/40 whitespace-nowrap"
              style={{ borderColor: '#E5E7EB', color: '#555' }}>
              {b.label}
            </Link>
          ))}
        </div>

        {/* Write Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <WriteHeader onCancel={() => setShowWriteModal(false)} title="파티 모집글 쓰기" />
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <div className="mb-3">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>제목</label>
                <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="모집 제목을 입력하세요"
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>내용</label>
                <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: '#999' }}>에디터 로딩 중...</div>}>
                  <RichTextEditor value={writeContent} onChange={setWriteContent} placeholder="모집 내용을 작성해주세요. 이미지/동영상 첨부 가능!" minHeight={300} />
                </Suspense>
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t"  style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
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
