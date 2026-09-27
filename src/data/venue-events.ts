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
};

export function getVenueEvent(slug: string): VenueEvent | null {
  return VENUE_EVENTS[slug] || null;
}
