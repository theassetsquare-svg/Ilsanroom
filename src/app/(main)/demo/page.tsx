"use client";

import { useState } from "react";
import {
  BarChart3,
  Star,
  Eye,
  TrendingUp,
  MessageSquare,
  Bell,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const mockStats = [
  { label: "오늘 방문자", value: "1,284", change: "+12%", icon: Eye },
  { label: "평균 평점", value: "4.7", change: "+0.3", icon: Star },
  { label: "이번 주 리뷰", value: "38", change: "+8", icon: MessageSquare },
  { label: "노출 순위", value: "3위", change: "▲2", icon: TrendingUp },
];

const mockReviews = [
  {
    user: "김**",
    rating: 5,
    text: "분위기 최고! 음악 선곡도 좋고 스태프 친절해요.",
    date: "2시간 전",
  },
  {
    user: "이**",
    rating: 4,
    text: "음료 퀄리티 좋음. 주말엔 웨이팅이 좀 있어요.",
    date: "5시간 전",
  },
  {
    user: "박**",
    rating: 5,
    text: "인테리어 새로 한 듯 깔끔해졌네요. 추천합니다.",
    date: "1일 전",
  },
];

const sidebarItems = [
  { icon: BarChart3, label: "대시보드", active: true },
  { icon: MessageSquare, label: "리뷰 관리", active: false },
  { icon: Eye, label: "노출 분석", active: false },
  { icon: Bell, label: "알림", active: false },
  { icon: Settings, label: "설정", active: false },
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("대시보드");

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-violet-600/20 px-4 py-1 text-xs font-medium text-violet-400">
            데모 체험
          </span>
          <h1 className="mb-4 text-4xl font-bold">
            업주 <span className="text-violet-400">대시보드</span> 미리보기
          </h1>
          <p className="mx-auto max-w-lg text-lg text-neutral-400">
            오늘밤어디 Pro 대시보드를 직접 체험해보세요. 실제 데이터 기반의
            인터랙티브 데모입니다.
          </p>
        </div>

        {/* Demo Dashboard */}
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          {/* Demo Top Bar */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-neutral-500">
              demo.ilsanroom.pages.dev
            </span>
            <div className="w-14" />
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="hidden w-48 shrink-0 border-r border-neutral-800 p-4 md:block">
              <div className="mb-6">
                <span className="text-sm font-bold text-violet-400">오늘밤어디</span>
                <span className="ml-1 text-xs text-neutral-500">Pro</span>
              </div>
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveTab(item.label)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      activeTab === item.label
                        ? "bg-violet-600/20 text-violet-400"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">대시보드</h2>
                  <p className="text-xs text-neutral-500">
                    마지막 업데이트: 방금 전
                  </p>
                </div>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                  실시간
                </span>
              </div>

              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {mockStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-neutral-950 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <stat.icon className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-green-400">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-neutral-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="mb-6 rounded-xl bg-neutral-950 p-4">
                <h3 className="mb-4 text-sm font-semibold">주간 방문자 추이</h3>
                <div className="flex h-32 items-end gap-2">
                  {[40, 65, 55, 80, 72, 90, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t bg-violet-600/60"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] text-neutral-600">
                        {["월", "화", "수", "목", "금", "토", "일"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="rounded-xl bg-neutral-950 p-4">
                <h3 className="mb-4 text-sm font-semibold">최근 리뷰</h3>
                <div className="space-y-3">
                  {mockReviews.map((review, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between rounded-lg bg-neutral-900 p-3"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {review.user}
                          </span>
                          <span className="flex gap-0.5 text-xs text-yellow-400">
                            {"★".repeat(review.rating)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          {review.text}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-neutral-600">
                        {review.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-neutral-400">
            실제 데이터로 업소를 관리하고 싶으신가요?
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            체험하기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
