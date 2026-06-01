/**
 * 업소별 진행 이벤트.
 * 키: venue.slug
 * 값: { headline, subline?, perks[] }
 *   - headline: 한 줄 후킹 카피 (가장 크게 노출)
 *   - subline: 부연 한 줄
 *   - perks: 실제 혜택 항목 (아이콘 + 타이틀 + 디테일)
 */

export interface VenuePerk {
  icon: string;
  title: string;
  detail: string;
}

export interface VenueEvent {
  headline: string;
  subline?: string;
  accent?: 'pink' | 'gold' | 'cyan';
  perks: VenuePerk[];
  footnote?: string;
}

export const VENUE_EVENTS: Record<string, VenueEvent> = {
  'haeundaehoppa-kkantappiya': {
    headline: '오늘 밤, 놀쿨이 미리 예매해둔 자리',
    subline: '해운대에서 가장 빛나는 창가 룸 — 그 자리를 온 당신께, 깐따삐야만의 환영 의식.',
    accent: 'pink',
    perks: [
      {
        icon: '🍺',
        title: '놀쿨 시그니처 웰컴 세트',
        detail: '전화 예약 시 "놀쿨 보고 연락드려요" 한마디면, 테이블에 맥주·안주가 먼저 도착합니다. 수빈 실장이 직접 세팅하는 깐따삐야만의 환영 절차입니다.',
      },
      {
        icon: '🎂',
        title: '생일자 전용 시크릿 세리머니',
        detail: '생일자의 이름으로 예약하신 분께는 깐따삐야 한정 케이크와 플로어 전원이 함께하는 깜짝 이벤트가 준비됩니다. 일 년에 단 하루, 주인공이 되어보세요.',
      },
    ],
    footnote: '예약은 실장 수빈 010-6773-6222 — 방문 3시간 전 연락 부탁드려요.',
  },
};

export function getVenueEvent(slug: string): VenueEvent | null {
  return VENUE_EVENTS[slug] || null;
}
