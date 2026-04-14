import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, deletePost, deleteComment, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));

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
  const now = new Date("2026-03-20");
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

const sampleParties: PartyItem[] = [
  {
    id: "sample-1",
    title: "이번 주말 근처 라운지 동행 구합니다",
    author: "라운지호스트",
    eventDate: "2026-03-22",
    region: "일산",
    currentMembers: 2,
    maxMembers: 6,
    ageRange: "20대 후반~30대",
    status: "열린 모임",
    comments: 7,
    description: "토요일 저녁 8시 라페스타 근처 라운지에서 만나서 가볍게 한잔하려고 합니다.",
  },
  {
    id: "sample-2",
    title: "3/21(토) 해당 지역 나이트 첫 도전 같이 갈 분",
    author: "입문희망자",
    eventDate: "2026-03-21",
    region: "일산",
    currentMembers: 3,
    maxMembers: 4,
    ageRange: "20대 중반",
    status: "거의 찬 번개",
    comments: 11,
    description: "혼자 가기 부담스러워서 함께할 분을 찾습니다. 초보 환영이에요!",
  },
  {
    id: "sample-3",
    title: "주엽역 와인바 소규모 약속 (4명 한정)",
    author: "와인소모임",
    eventDate: "2026-03-28",
    region: "일산",
    currentMembers: 1,
    maxMembers: 4,
    ageRange: "30대",
    status: "신청 가능",
    comments: 3,
    description: "와인 시음하며 편하게 대화 나눌 분을 모집합니다. 와인 초심자도 대환영.",
  },
  {
    id: "sample-4",
    title: "킨텍스 인근 금요 정모 (정기)",
    author: "금요밤지기",
    eventDate: "2026-03-27",
    region: "해당 지역",
    currentMembers: 8,
    maxMembers: 8,
    ageRange: "20대~30대",
    status: "끝",
    comments: 19,
    description: "매주 금요일 킨텍스 근처에서 진행하는 정기 번개입니다. 다음 주차 신청은 월요일 오픈!",
  },
  {
    id: "sample-5",
    title: "백석동 신상 바 탐방 동행자 모집",
    author: "신상탐험가",
    eventDate: "2026-03-29",
    region: "근처",
    currentMembers: 2,
    maxMembers: 5,
    ageRange: "20대 후반",
    status: "자리 있음",
    comments: 5,
    description: "새로 오픈한 곳들을 돌아보며 솔직하게 비교해보려 합니다. 리뷰 작성도 함께해요.",
  },
];

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
            className="w-32 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-accent" />
        </div>
        <div>
          <label className="block text-xs text-neon-text-muted mb-1">인원</label>
          <input type="number" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="4"
            className="w-20 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-accent" />
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
  const [parties, setParties] = useState<PartyItem[]>(sampleParties);
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

  const filtered = statusFilter === "전체"
    ? parties
    : parties.filter((p) => p.status === statusFilter);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">파티모임</h1>
            <p className="mt-2 text-neon-text-muted">
              같이 갈 사람 찾거나, 열린 약속에 끼어들어 봐
            </p>
          </div>
          <button
            onClick={handleWriteClick}
            className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light"
          >
            모집글 올리기
          </button>
        </div>

        {/* Auth Error Toast */}
        {authError && (
          <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/10 px-5 py-3 text-sm text-neon-red">
            로그인이 필요합니다
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          {(["전체", "모집중", "신청 가능", "자리 있음", "열린 모임", "곧 마감", "끝", "완료", "종결"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                statusFilter === s
                  ? "bg-neon-primary text-neon-text"
                  : "border border-neon-border text-neon-text-muted hover:border-neon-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <NbbangCalc />

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            불러오는 중...
          </div>
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
                      <button className="rounded-lg bg-neon-primary/20 px-4 py-1.5 text-xs font-medium text-neon-primary-light transition hover:bg-neon-primary/30">
                        합류 신청
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
                아직 게시글이 없습니다
              </div>
            )}
          </div>
        )}

        {/* Write Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setShowWriteModal(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
              <h2 className="text-base font-bold" style={{ color: '#111' }}>글쓰기</h2>
              <div style={{ width: 44 }} />
            </div>
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
