import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "업주 대시보드 - NEON 나이트라이프",
  description: "업소 관리를 위한 업주 전용 대시보드.",
};

const stats = [
  { label: "오늘 방문자", value: "1,284", change: "+12.5%", positive: true },
  { label: "이번 달 리뷰", value: "48", change: "+8.3%", positive: true },
  { label: "평균 평점", value: "4.5", change: "+0.2", positive: true },
  { label: "예약 문의", value: "23", change: "-3.1%", positive: false },
];

const menuItems = [
  { label: "업소 정보 관리", description: "기본 정보, 사진, 영업시간 수정", icon: "📋" },
  { label: "리뷰 관리", description: "고객 리뷰 확인 및 답변", icon: "⭐" },
  { label: "이벤트 등록", description: "파티, 프로모션 이벤트 관리", icon: "🎉" },
  { label: "통계 분석", description: "방문자, 검색 노출 통계", icon: "📊" },
  { label: "프리미엄 관리", description: "프리미엄 등록 및 광고 설정", icon: "👑" },
  { label: "설정", description: "알림, 계정, 결제 설정", icon: "⚙️" },
];

const recentActivities = [
  { type: "리뷰", message: "새로운 리뷰가 등록되었습니다 (★4.5)", time: "10분 전" },
  { type: "문의", message: "예약 관련 문의가 접수되었습니다", time: "32분 전" },
  { type: "통계", message: "일일 방문자 1,000명 돌파", time: "2시간 전" },
  { type: "시스템", message: "업소 정보가 업데이트되었습니다", time: "5시간 전" },
  { type: "리뷰", message: "리뷰에 대한 답변이 필요합니다", time: "어제" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">업주 대시보드</h1>
            <p className="mt-1 text-neutral-400">안녕하세요, 관리자님</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm transition hover:bg-neutral-800">
              업소 페이지 보기
            </button>
            <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium transition hover:bg-violet-500">
              공지 등록
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <p className="text-sm text-neutral-400">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span
                  className={`text-sm font-medium ${
                    stat.positive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Menu Grid */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold">관리 메뉴</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {menuItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-violet-500/50 hover:bg-neutral-900/80"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-2xl">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="text-sm text-neutral-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-xl font-bold">최근 활동</h2>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900">
              {recentActivities.map((activity, i) => (
                <div
                  key={i}
                  className={`px-5 py-4 ${
                    i !== recentActivities.length - 1 ? "border-b border-neutral-800" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                      {activity.type}
                    </span>
                    <span className="text-xs text-neutral-500">{activity.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-300">{activity.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Chart Placeholder */}
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-xl font-bold">방문자 추이 (최근 7일)</h2>
          <div className="flex h-48 items-end justify-between gap-2 px-4">
            {[65, 78, 52, 91, 84, 110, 95].map((value, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-violet-600/40 transition hover:bg-violet-600/60"
                  style={{ height: `${(value / 110) * 100}%` }}
                />
                <span className="text-xs text-neutral-500">
                  {["월", "화", "수", "목", "금", "토", "일"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
