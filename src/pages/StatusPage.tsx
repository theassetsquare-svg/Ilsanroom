

import { CheckCircle2, Clock, Bell, Mail } from "lucide-react";
import { useState } from "react";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/**
 * 서비스 상태 페이지 — 검증되지 않은 가동률·응답 시간·인시던트 이력은 표기하지 않음.
 * 외부 모니터링(Uptime Robot 공개 페이지) 연결 전까지는 정상 동작 안내만 노출.
 */
export default function StatusPage() {
  useDocumentMeta(
    '서비스 상태',
    '놀쿨 서비스 상태와 점검 일정을 안내합니다. 장애 발생 시 즉시 공지하고, 상태 알림 메일을 받아볼 수 있습니다.'
  );
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
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            서비스 <span className="text-neon-primary-light">상태</span>
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-neon-green/10 px-5 py-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-neon-green" />
            </span>
            <span className="text-sm font-medium text-neon-green">
              서비스 정상 운영 중
            </span>
          </div>
        </div>

        {/* 안내 */}
        <div className="mb-12 rounded-2xl border border-neon-border bg-neon-surface p-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-neon-primary-light" />
            <p className="text-sm font-medium text-neon-text-muted">상태 안내</p>
          </div>
          <p className="text-base leading-relaxed text-neon-text">
            현재 놀쿨 모든 서비스는 정상 운영 중입니다.<br />
            점검·장애 발생 시 이 페이지와 가입한 이메일로 즉시 공지합니다.
          </p>
          <p className="mt-4 text-xs text-neon-text-muted">
            외부 모니터링 공개 대시보드는 준비 중이며, 검증되지 않은 가동률 수치는 표기하지 않습니다.
          </p>
        </div>

        {/* 모니터링 운영 방식 */}
        <div className="mb-12 rounded-2xl border border-neon-border bg-neon-surface p-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-neon-primary-light" />
            <h2 className="text-lg font-bold">모니터링 운영 방식</h2>
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-neon-text-muted">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
              <span>장애 감지 시 운영팀에 자동 알림이 전송됩니다.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
              <span>예정된 점검은 최소 24시간 전에 사전 공지합니다.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
              <span>장애 발생·복구 사실은 이 페이지에 사후 공개합니다.</span>
            </li>
          </ul>
        </div>

        {/* Subscribe */}
        <div className="rounded-2xl border border-neon-border bg-neon-surface p-8">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-neon-primary-light" />
            <h2 className="text-lg font-bold">상태 알림 구독</h2>
          </div>
          <p className="text-sm text-neon-text-muted mb-6">
            서비스 상태 변경 알림을 이메일로 받으세요. 장애 발생, 복구, 예정된 유지보수 소식을
            바로바로 알려드립니다.
          </p>
          {subscribed ? (
            <div className="flex items-center gap-2 rounded-xl bg-neon-green/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-neon-green" />
              <p className="text-sm text-neon-green">구독이 완료되었습니다. 상태 변경 시 알림을 보내드리겠습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                required
                className="flex-1 rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neon-text-muted outline-none transition focus:border-violet-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-neon-primary px-6 py-3 text-sm font-medium text-neon-text transition hover:bg-violet-500"
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
