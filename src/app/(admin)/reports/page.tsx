import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "신고 관리 - 일산룸포털 관리자",
  description: "커뮤니티 신고 접수 및 처리 현황을 관리합니다.",
};

const stats = [
  { label: "총 신고", value: "156", icon: "📋" },
  { label: "검토 대기", value: "23", icon: "⏳" },
  { label: "처리 완료", value: "128", icon: "✅" },
  { label: "정지된 사용자", value: "5", icon: "🚫" },
];

type ReportStatus = "대기중" | "검토중" | "처리완료" | "기각";

interface Report {
  id: string;
  type: "게시글" | "댓글" | "리뷰";
  content: string;
  reason: string;
  reporter: string;
  date: string;
  status: ReportStatus;
}

const reports: Report[] = [
  {
    id: "RPT-001",
    type: "리뷰",
    content: "업소 관계자로 의심되는 홍보성 리뷰...",
    reason: "허위 정보 또는 거짓 리뷰",
    reporter: "user_nightowl",
    date: "2026-03-14",
    status: "대기중",
  },
  {
    id: "RPT-002",
    type: "댓글",
    content: "심한 욕설 및 비하 발언 포함 댓글",
    reason: "욕설 또는 비속어",
    reporter: "user_partyking",
    date: "2026-03-14",
    status: "대기중",
  },
  {
    id: "RPT-003",
    type: "게시글",
    content: "외부 사이트 링크 반복 게시 (스팸)",
    reason: "스팸 또는 광고",
    reporter: "user_clubber22",
    date: "2026-03-13",
    status: "검토중",
  },
  {
    id: "RPT-004",
    type: "리뷰",
    content: "타인의 사진을 도용한 리뷰",
    reason: "개인정보 노출",
    reporter: "user_vip_star",
    date: "2026-03-13",
    status: "검토중",
  },
  {
    id: "RPT-005",
    type: "댓글",
    content: "불법 약물 관련 언급 포함",
    reason: "불법 행위 조장",
    reporter: "user_safeguard",
    date: "2026-03-12",
    status: "처리완료",
  },
  {
    id: "RPT-006",
    type: "게시글",
    content: "부적절한 이미지 포함 게시글",
    reason: "성적/음란 콘텐츠",
    reporter: "user_mod_helper",
    date: "2026-03-12",
    status: "처리완료",
  },
  {
    id: "RPT-007",
    type: "리뷰",
    content: "경쟁 업소 폄하 목적의 악성 리뷰",
    reason: "허위 정보 또는 거짓 리뷰",
    reporter: "user_honest99",
    date: "2026-03-11",
    status: "처리완료",
  },
  {
    id: "RPT-008",
    type: "댓글",
    content: "단순 의견 차이로 인한 신고",
    reason: "기타",
    reporter: "user_newbie01",
    date: "2026-03-11",
    status: "기각",
  },
];

const statusStyles: Record<ReportStatus, string> = {
  "대기중": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "검토중": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "처리완료": "bg-green-500/10 text-green-400 border-green-500/20",
  "기각": "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
};

const typeStyles: Record<string, string> = {
  "게시글": "bg-violet-500/10 text-violet-400",
  "댓글": "bg-cyan-500/10 text-cyan-400",
  "리뷰": "bg-amber-500/10 text-amber-400",
};

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">신고 관리</h1>
            <p className="mt-1 text-neutral-400">커뮤니티 신고 현황을 확인하고 처리합니다</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm transition hover:bg-neutral-800">
              필터
            </button>
            <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium transition hover:bg-violet-500">
              내보내기
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{stat.label}</span>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/50">
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-neutral-400">유형</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-neutral-400">콘텐츠</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-neutral-400">신고사유</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-neutral-400">신고자</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-neutral-400">날짜</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-neutral-400">상태</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-left font-medium text-neutral-400">액션</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-neutral-800/50 transition hover:bg-neutral-800/30 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${typeStyles[report.type]}`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3.5 text-neutral-300">
                      {report.content}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-neutral-300">
                      {report.reason}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-neutral-400">
                      {report.reporter}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-neutral-400">
                      {report.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[report.status]}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex gap-2">
                        {(report.status === "대기중" || report.status === "검토중") && (
                          <>
                            <button className="rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-400 transition hover:bg-violet-600/30">
                              검토
                            </button>
                            <button className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-600/30">
                              삭제
                            </button>
                            <button className="rounded-lg bg-neutral-700/30 px-3 py-1.5 text-xs font-medium text-neutral-400 transition hover:bg-neutral-700/50">
                              기각
                            </button>
                          </>
                        )}
                        {report.status === "처리완료" && (
                          <span className="text-xs text-neutral-500">처리됨</span>
                        )}
                        {report.status === "기각" && (
                          <span className="text-xs text-neutral-500">기각됨</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination hint */}
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>총 156건 중 1-8 표시</span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-neutral-700 px-3 py-1.5 transition hover:bg-neutral-800">이전</button>
            <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-white">1</button>
            <button className="rounded-lg border border-neutral-700 px-3 py-1.5 transition hover:bg-neutral-800">2</button>
            <button className="rounded-lg border border-neutral-700 px-3 py-1.5 transition hover:bg-neutral-800">3</button>
            <button className="rounded-lg border border-neutral-700 px-3 py-1.5 transition hover:bg-neutral-800">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
