/**
 * 실시간 수치 위젯들 — 출처 검증 가능한 데이터가 없어 비활성화.
 * 시드 기반 가짜 카운터(접속자/방문자/회원수)를 모두 제거하고 null 렌더링.
 * 31개 임포트와 호환을 위해 동일한 export 시그니처는 유지.
 */
import type { ReactNode } from 'react';

const HIDE: ReactNode = null;

export function PageLiveCounter(_: { pageName?: string; baseCount?: number; className?: string }) {
  return HIDE;
}

export function TodayStats(_: { className?: string }) {
  return HIDE;
}

export function VenueCardStats(_: { slug: string; className?: string }) {
  return HIDE;
}

export function CommunityPulse(_: { className?: string }) {
  return HIDE;
}

export function RecentJoinTicker(_: { className?: string }) {
  return HIDE;
}

export function GuideReadCount(_: { category: string; className?: string }) {
  return HIDE;
}
