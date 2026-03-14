import type { Metadata } from "next";
import {
  CheckCircle2,
  Server,
  Globe,
  Database,
  Wifi,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "서비스 상태 - NEON",
  description:
    "NEON 서비스 시스템 상태를 실시간으로 확인하세요. API, 웹, 데이터베이스, CDN 상태 모니터링.",
};

const systems = [
  {
    name: "API 서버",
    description: "REST API 및 인증 서비스",
    icon: Server,
    status: "정상",
    uptime: "99.98%",
    responseTime: "42ms",
  },
  {
    name: "웹 애플리케이션",
    description: "프론트엔드 및 대시보드",
    icon: Globe,
    status: "정상",
    uptime: "99.99%",
    responseTime: "18ms",
  },
  {
    name: "데이터베이스",
    description: "주 DB 및 읽기 복제본",
    icon: Database,
    status: "정상",
    uptime: "99.97%",
    responseTime: "8ms",
  },
  {
    name: "CDN",
    description: "정적 자산 및 이미지 전송",
    icon: Wifi,
    status: "정상",
    uptime: "99.99%",
    responseTime: "12ms",
  },
];

const recentIncidents = [
  {
    date: "2026-03-01",
    title: "CDN 캐시 갱신 지연",
    duration: "약 15분",
    resolved: true,
  },
  {
    date: "2026-02-14",
    title: "DB 읽기 복제본 일시 지연",
    duration: "약 8분",
    resolved: true,
  },
  {
    date: "2026-01-28",
    title: "API 서버 응답 지연",
    duration: "약 22분",
    resolved: true,
  },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            서비스 <span className="text-violet-400">상태</span>
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-5 py-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium text-green-400">
              모든 시스템 정상 운영 중
            </span>
          </div>
        </div>

        {/* Overall Uptime */}
        <div className="mb-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p className="mb-1 text-sm text-neutral-400">전체 가동률 (30일)</p>
          <p className="text-5xl font-extrabold text-violet-400">99.9%</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Clock className="h-3.5 w-3.5" />
            마지막 확인: 방금 전
          </div>
        </div>

        {/* System Status */}
        <div className="mb-12 space-y-3">
          {systems.map((sys) => (
            <div
              key={sys.name}
              className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-neutral-800 p-2.5">
                  <sys.icon className="h-5 w-5 text-neutral-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{sys.name}</h3>
                  <p className="text-xs text-neutral-500">{sys.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-neutral-500">응답 시간</p>
                  <p className="text-sm font-medium">{sys.responseTime}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-neutral-500">가동률</p>
                  <p className="text-sm font-medium">{sys.uptime}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    {sys.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 30-day bar visualization */}
        <div className="mb-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-sm font-semibold">
            30일 가동 현황
          </h2>
          <div className="flex gap-0.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className={`h-8 flex-1 rounded-sm ${
                  i === 12 || i === 25
                    ? "bg-yellow-500/60"
                    : "bg-green-500/60"
                }`}
                title={
                  i === 12 || i === 25
                    ? "일부 지연 발생"
                    : "정상"
                }
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500">
            <span>30일 전</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm bg-green-500/60" />
                정상
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm bg-yellow-500/60" />
                일부 지연
              </span>
            </div>
            <span>오늘</span>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <h2 className="mb-6 text-lg font-bold">최근 인시던트</h2>
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <div
                key={incident.date}
                className="flex items-start justify-between rounded-xl bg-neutral-950 p-4"
              >
                <div>
                  <h3 className="text-sm font-medium">{incident.title}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {incident.date} &middot; 소요 시간: {incident.duration}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                  해결됨
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-neutral-600">
            이전 인시던트 기록은 보관 정책에 따라 90일간 유지됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
