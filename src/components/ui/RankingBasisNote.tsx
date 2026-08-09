import { hasPopularityData, POPULARITY_UPDATED_AT } from '@/lib/popularity';

/**
 * 투명 라벨 (한국1위 파트4 S1-1d) — 모든 순위 노출 지점 상단 고정.
 * 데이터 없으면 "최신 등록순" 정직 상태를 그대로 말한다. 수치 창작 0.
 */
/** 위젯 헤딩 옆 컴팩트 버전 — 홈 TOP4/TOP8/카테고리 TOP3 등 좁은 지점용 동일 라벨. */
export function RankingBasisInline({ className = '' }: { className?: string }) {
  return (
    <span className={`text-[10px] ${className}`} style={{ color: '#9CA3AF' }}>
      {hasPopularityData()
        ? `28일 실측 조회·문의·검색 기준 · ${POPULARITY_UPDATED_AT} 갱신 · 광고비 반영 0`
        : '최신 등록순 · 실측 데이터 수집 중 · 광고비 반영 0'}
    </span>
  );
}

export default function RankingBasisNote({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <p
      className="rounded-lg px-3 py-2 text-[11px] leading-relaxed"
      style={{
        backgroundColor: dark ? 'rgba(255,255,255,0.07)' : '#F6F4FF',
        color: dark ? 'rgba(255,255,255,0.65)' : '#6D28D9',
      }}
    >
      {hasPopularityData() ? (
        <>순위 기준: 최근 28일 실제 조회·전화 문의·검색 유입 · 매주 자동 갱신(마지막 갱신 {POPULARITY_UPDATED_AT}) · 광고비로 순위를 살 수 없습니다</>
      ) : (
        <>지금은 최신 등록순 정렬입니다. 실제 조회 데이터가 쌓이는 대로 매주 자동 갱신되는 실측 순위로 전환됩니다 · 광고비로 순위를 살 수 없습니다</>
      )}
    </p>
  );
}
