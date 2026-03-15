"use client";

import { useState } from "react";

const stats = [
  { label: "오늘 조회수", value: "1,284", change: "+12.5%", positive: true },
  { label: "이번 달 예약", value: "48", change: "+8.3%", positive: true },
  { label: "리뷰 수", value: "23", change: "+3건", positive: true },
  { label: "평균 평점", value: "4.5", change: "+0.2", positive: true },
];

const weeklyData = [
  { day: "월", value: 65 },
  { day: "화", value: 78 },
  { day: "수", value: 52 },
  { day: "목", value: 91 },
  { day: "금", value: 84 },
  { day: "토", value: 110 },
  { day: "일", value: 95 },
];

const recentReviews = [
  {
    id: 1,
    author: "야간비행",
    rating: 5,
    text: "분위기가 정말 좋고, 직원분들이 친절해서 만족스러운 시간을 보냈습니다.",
    date: "2시간 전",
    replied: false,
  },
  {
    id: 2,
    author: "일산마스터",
    rating: 4,
    text: "음악 선곡이 좋았어요. 다만 주말에 웨이팅이 좀 있었습니다.",
    date: "5시간 전",
    replied: false,
  },
  {
    id: 3,
    author: "나이트올빼미",
    rating: 4,
    text: "가격 대비 만족스러운 서비스였습니다. 재방문 의사 있습니다.",
    date: "어제",
    replied: true,
  },
];

const reservations = [
  { id: 1, date: "2026-03-14", people: 4, status: "대기중", note: "생일파티" },
  { id: 2, date: "2026-03-14", people: 8, status: "확인됨", note: "단체모임" },
  { id: 3, date: "2026-03-15", people: 2, status: "대기중", note: "-" },
  { id: 4, date: "2026-03-15", people: 6, status: "확인됨", note: "VIP룸 요청" },
  { id: 5, date: "2026-03-16", people: 10, status: "대기중", note: "회식" },
];

const upcomingEvents = [
  {
    id: 1,
    title: "금요 DJ 나이트",
    date: "2026-03-20 (금)",
    description: "스페셜 게스트 DJ와 함께하는 금요일 밤 파티",
  },
  {
    id: 2,
    title: "봄맞이 프로모션",
    date: "2026-03-22 ~ 2026-04-05",
    description: "음료 1+1 및 룸 이용료 20% 할인 프로모션",
  },
];

const quickLinks = [
  { label: "업소 정보 수정", icon: "📋", href: "#" },
  { label: "사진 운영", icon: "📸", href: "#" },
  { label: "가격 수정", icon: "💰", href: "#" },
  { label: "행사 추가", icon: "🎉", href: "#" },
  { label: "구독 관리", icon: "👑", href: "#" },
  { label: "인보이스", icon: "🧾", href: "#" },
];

export default function DashboardPage() {
  const [reservationStatuses, setReservationStatuses] = useState<
    Record<number, string>
  >(
    Object.fromEntries(reservations.map((r) => [r.id, r.status]))
  );

  const handleReservation = (id: number, action: "확인됨" | "거절됨") => {
    setReservationStatuses((prev) => ({ ...prev, [id]: action }));
  };

  const maxValue = Math.max(...weeklyData.map((d) => d.value));

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">업주 대시보드</h1>
            <p className="mt-1 text-neon-text-muted">안녕하세요, 관리자님</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border border-neon-border bg-neon-surface px-4 py-2 text-sm transition hover:bg-neon-surface-2">
              업소 페이지 보기
            </button>
            <button className="rounded-xl bg-neon-primary px-4 py-2 text-sm font-medium transition hover:bg-neon-primary-light">
              공지 작성
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-neon-border bg-neon-surface p-5"
            >
              <p className="text-sm text-neon-text-muted">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span
                  className={`text-sm font-medium ${
                    stat.positive ? "text-neon-green" : "text-red-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Trend Chart */}
        <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface p-6">
          <h2 className="mb-4 text-xl font-bold">주간 조회수 추이</h2>
          <div className="flex h-48 items-end justify-between gap-2 px-4">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-neon-text-muted">{d.value}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all hover:from-violet-500 hover:to-violet-300"
                  style={{ height: `${(d.value / maxValue) * 100}%` }}
                />
                <span className="text-xs text-neon-text-muted">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Recent Reviews */}
          <div>
            <h2 className="mb-4 text-xl font-bold">최근 리뷰</h2>
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-neon-border bg-neon-surface p-5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.author}</span>
                      <span className="text-sm text-neon-gold">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                    </div>
                    <span className="text-xs text-neon-text-muted">
                      {review.date}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-neon-text">{review.text}</p>
                  {review.replied ? (
                    <span className="inline-block rounded-full bg-neon-green/10 px-3 py-1 text-xs text-neon-green">
                      답변 완료
                    </span>
                  ) : (
                    <button className="rounded-lg border border-violet-500/50 bg-neon-primary/10 px-4 py-1.5 text-xs font-medium text-neon-primary-light transition hover:bg-neon-primary/20">
                      답변하기
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Event Management */}
          <div>
            <h2 className="mb-4 text-xl font-bold">행사 운영</h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-neon-border bg-neon-surface p-5"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold text-neon-primary-light">
                      {event.title}
                    </h3>
                    <button className="rounded-lg border border-neon-border bg-neon-surface-2 px-3 py-1 text-xs text-neon-text transition hover:bg-neon-surface-2">
                      수정
                    </button>
                  </div>
                  <p className="mb-1 text-xs text-neon-text-muted">{event.date}</p>
                  <p className="text-sm text-neon-text-muted">
                    {event.description}
                  </p>
                </div>
              ))}
              <button className="w-full rounded-2xl border border-dashed border-neon-border bg-neon-surface/50 py-4 text-sm text-neon-text-muted transition hover:border-neon-primary/50 hover:text-neon-primary-light">
                + 새 행사 추가
              </button>
            </div>
          </div>
        </div>

        {/* Reservation Management */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold">예약 관리</h2>
          <div className="overflow-x-auto rounded-2xl border border-neon-border bg-neon-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neon-border text-neon-text-muted">
                  <th className="px-5 py-3 text-left font-medium">날짜</th>
                  <th className="px-5 py-3 text-left font-medium">인원</th>
                  <th className="px-5 py-3 text-left font-medium">상태</th>
                  <th className="px-5 py-3 text-left font-medium">특이사항</th>
                  <th className="px-5 py-3 text-right font-medium">처리</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => {
                  const status = reservationStatuses[res.id] || res.status;
                  return (
                    <tr
                      key={res.id}
                      className="border-b border-neon-border/50 last:border-0"
                    >
                      <td className="px-5 py-3 text-neon-text">
                        {res.date}
                      </td>
                      <td className="px-5 py-3 text-neon-text">
                        {res.people}명
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            status === "확인됨"
                              ? "bg-neon-green/10 text-neon-green"
                              : status === "거절됨"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-neon-gold"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-neon-text-muted">{res.note}</td>
                      <td className="px-5 py-3 text-right">
                        {status === "대기중" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleReservation(res.id, "확인됨")
                              }
                              className="rounded-lg bg-green-600/20 px-3 py-1 text-xs text-neon-green transition hover:bg-green-600/30"
                            >
                              확인
                            </button>
                            <button
                              onClick={() =>
                                handleReservation(res.id, "거절됨")
                              }
                              className="rounded-lg bg-red-600/20 px-3 py-1 text-xs text-red-400 transition hover:bg-red-600/30"
                            >
                              거절
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neon-text-muted">
                            처리됨
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold">빠른 메뉴</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-4 rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/50 hover:bg-neon-surface/80"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-neon-primary/10 text-2xl">
                  {link.icon}
                </span>
                <span className="font-semibold">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Subscription Status */}
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/5 to-neutral-900 p-6">
          <h2 className="mb-4 text-xl font-bold">구독 현황</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-neon-text-muted">현재 플랜</p>
              <p className="mt-1 text-lg font-bold text-neon-primary-light">
                프로 플랜
              </p>
              <span className="mt-1 inline-block rounded-full bg-neon-primary/20 px-2.5 py-0.5 text-xs text-violet-300">
                PRO
              </span>
            </div>
            <div>
              <p className="text-sm text-neon-text-muted">다음 결제일</p>
              <p className="mt-1 text-lg font-bold text-neon-text">2026-04-14</p>
              <p className="mt-1 text-xs text-neon-text-muted">
                월 49,000원 자동 결제
              </p>
            </div>
            <div>
              <p className="text-sm text-neon-text-muted">이용량</p>
              <div className="mt-2 space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-neon-text-muted">사진 게시</span>
                    <span className="text-neon-text">24 / 50</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neon-surface-2">
                    <div
                      className="h-full rounded-full bg-neon-primary-light"
                      style={{ width: "48%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-neon-text-muted">프로모션 게시</span>
                    <span className="text-neon-text">2 / 10</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neon-surface-2">
                    <div
                      className="h-full rounded-full bg-neon-primary-light"
                      style={{ width: "20%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
