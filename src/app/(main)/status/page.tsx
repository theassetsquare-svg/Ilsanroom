'use client';

import {
  CheckCircle2,
  Server,
  Globe,
  Database,
  Wifi,
  Clock,
  Bell,
  Shield,
  Mail,
} from "lucide-react";
import { useState } from "react";

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

// Generate 30-day uptime data
const uptimeDays = Array.from({ length: 30 }).map((_, i) => {
  if (i === 12) return { status: 'degraded' as const, label: '일부 지연 발생' };
  if (i === 25) return { status: 'degraded' as const, label: '일부 지연 발생' };
  return { status: 'ok' as const, label: '정상' };
});

export default function StatusPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

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

        {/* Service Uptime */}
        <div className="mb-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-violet-400" />
            <p className="text-sm font-medium text-neutral-300">서비스 업타임</p>
          </div>
          <p className="text-5xl font-extrabold text-violet-400">99.9%</p>
          <p className="mt-2 text-xs text-neutral-500">월간 평균 가동률</p>
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
            최근 30일 가동 현황
          </h2>
          <div className="flex gap-0.5">
            {uptimeDays.map((day, i) => (
              <div
                key={i}
                className={`h-8 flex-1 rounded-sm ${
                  day.status === 'degraded'
                    ? "bg-yellow-500/60"
                    : day.status === 'ok'
                    ? "bg-green-500/60"
                    : "bg-red-500/60"
                }`}
                title={day.label}
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
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm bg-red-500/60" />
                장애
              </span>
            </div>
            <span>오늘</span>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="mb-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <h2 className="mb-6 text-lg font-bold">인시던트 이력</h2>
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

        {/* Monitoring */}
        <div className="mb-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold">모니터링</h2>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            일산룸포털은 <span className="text-white font-medium">Uptime Robot</span>을 통해 1분 간격으로
            모든 서비스의 가용성을 모니터링하고 있습니다. 장애 발생 시 자동으로 알림이 전송되며,
            운영팀이 즉시 대응합니다.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-neutral-950 p-4">
              <p className="text-2xl font-bold text-violet-400">1분</p>
              <p className="mt-1 text-xs text-neutral-500">모니터링 간격</p>
            </div>
            <div className="rounded-xl bg-neutral-950 p-4">
              <p className="text-2xl font-bold text-violet-400">4개</p>
              <p className="mt-1 text-xs text-neutral-500">모니터링 대상</p>
            </div>
            <div className="rounded-xl bg-neutral-950 p-4">
              <p className="text-2xl font-bold text-violet-400">24/7</p>
              <p className="mt-1 text-xs text-neutral-500">상시 감시</p>
            </div>
          </div>
        </div>

        {/* Subscribe */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold">상태 알림 구독</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-6">
            서비스 상태 변경 알림을 이메일로 받으세요. 장애 발생, 복구, 예정된 유지보수 소식을
            실시간으로 전달해 드립니다.
          </p>
          {subscribed ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-400">구독이 완료되었습니다. 상태 변경 시 알림을 보내드리겠습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                required
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition focus:border-violet-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                구독하기
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
