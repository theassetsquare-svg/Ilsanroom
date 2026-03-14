import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Q&A - 일산룸포털 커뮤니티",
  description: "나이트라이프에 대한 궁금증을 질문하고 답변을 받아보세요.",
};

const sampleQuestions = [
  {
    id: 1,
    title: "클럽 첫 방문인데 혼자 가도 괜찮을까요?",
    author: "궁금이",
    date: "2026-03-13",
    answers: 8,
    likes: 45,
    solved: true,
    tags: ["초보", "클럽"],
  },
  {
    id: 2,
    title: "강남과 홍대 클럽 분위기 차이가 어떤가요?",
    author: "선택장애",
    date: "2026-03-13",
    answers: 12,
    likes: 67,
    solved: true,
    tags: ["강남", "홍대", "비교"],
  },
  {
    id: 3,
    title: "나이트클럽 입장 시 신분증 꼭 필요한가요?",
    author: "초보질문",
    date: "2026-03-12",
    answers: 5,
    likes: 23,
    solved: true,
    tags: ["입장", "신분증"],
  },
  {
    id: 4,
    title: "라운지바와 클럽의 차이가 뭔가요?",
    author: "라운지궁금",
    date: "2026-03-12",
    answers: 6,
    likes: 34,
    solved: true,
    tags: ["라운지", "클럽", "차이"],
  },
  {
    id: 5,
    title: "호빠 이용 에티켓이 궁금합니다",
    author: "에티켓질문",
    date: "2026-03-11",
    answers: 4,
    likes: 28,
    solved: false,
    tags: ["호빠", "에티켓"],
  },
  {
    id: 6,
    title: "부산 해운대 클럽 추천해주세요",
    author: "부산여행",
    date: "2026-03-11",
    answers: 9,
    likes: 41,
    solved: true,
    tags: ["부산", "해운대", "추천"],
  },
  {
    id: 7,
    title: "요정은 어떤 곳인가요? 처음 가보려는데",
    author: "전통궁금",
    date: "2026-03-10",
    answers: 3,
    likes: 19,
    solved: false,
    tags: ["요정", "초보"],
  },
];

export default function QnAPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/community" className="mb-2 inline-block text-sm text-neutral-500 hover:text-violet-400">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">Q&A</h1>
            <p className="mt-2 text-neutral-400">궁금한 점을 질문하고 답변받기</p>
          </div>
          <button className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium transition hover:bg-violet-500">
            질문하기
          </button>
        </div>

        <div className="mb-6 flex gap-3">
          {["전체", "미해결", "해결됨", "인기순"].map((tab) => (
            <button
              key={tab}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-neutral-400 transition hover:bg-neutral-800 hover:text-white first:bg-violet-600 first:text-white"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {sampleQuestions.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-700"
            >
              <div
                className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs ${
                  q.solved
                    ? "bg-green-500/10 text-green-400"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                <span className="text-lg font-bold">{q.answers}</span>
                <span>답변</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold hover:text-violet-400">
                  {q.solved && (
                    <span className="mr-2 text-xs text-green-400">[해결]</span>
                  )}
                  {q.title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  {q.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <div>♥ {q.likes}</div>
                <div className="mt-1">{q.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
