import type { Venue } from '@/types';

/**
 * Generate unique hooking title for each venue.
 * Format: "[가게이름] — [고유 매력 한줄] | 일산룸포털"
 * NO duplicate titles. Each venue gets a unique hook.
 */
export function getHookingTitle(venue: Venue): string {
  const hooks: Record<string, string> = {
    // ── 사용자 지정 22+4개 업소 ──
    'ilsan-room': '일산룸 — 신실장이 직접 운영하는 일산 프리미엄 룸의 기준',
    'ilsan-myeongwolgwan-yojeong': '일산명월관요정 — 15가지 한정식에 국악 라이브, 접대의 끝판왕',
    'busan-yeonsan-mul-night': '부산연산동물나이트 — 부산 부킹률 1위, 따봉이 보장하는 밤',
    'seongnam-shampoo-night': '성남샴푸나이트 — 박찬호가 안내하는 성남 사교의 성지',
    'suwon-chance-dome-night': '수원찬스돔나이트 — 강호동이 직접 안내하는 수원 밤의 전설',
    'suyu-shampoo-night': '수유샴푸나이트 — 강북 직장인이 퇴근 후 향하는 곳',
    'sinlim-grandprix-night': '신림그랑프리나이트 — 태양 실장의 관악 최고 댄스홀',
    'cheongdam-h2o-night': '청담H2O나이트 — 100% 예약제, 청담의 품격',
    'indeokwon-gukbingwan-night': '인덕원국빈관나이트 — 인덕원의 전설적 나이트',
    'paju-yadang-skydome-night': '파주야당스카이돔나이트 — 막내가 이끄는 경기북부 최대 댄스홀',
    'ulsan-champion-night': '울산챔피언나이트 — 춘자 실장, 울산 밤문화의 살아있는 전설',
    'ilsan-shampoo-night': '일산샴푸나이트 — 일산 유흥가의 숨은 사교 클래식',
    'incheon-arabian-night': '인천아라비안나이트 — 4층 규모, 인천 프리미엄 엔터테인먼트',
    'daejeon-seven-night': '대전세븐나이트 — 충청 공무원들의 금요일 해방구',
    'sangbong-hankukkwan-night': '상봉동한국관나이트 — 서울 동부 전통 사교의 정석',
    'gangnam-club-race': '강남클럽레이스 — 강남에서 줄 가장 긴 EDM 클럽, 이유가 있다',
    'gangnam-club-sound': '강남클럽사운드 — EDM+힙합 하이브리드, 신사역 5분',
    'itaewon-club-waikiki-utopia': '이태원클럽와이키키유토피아 — 레게톤과 아프로비츠의 글로벌 파티',
    'gangnam-lounge-hype': '강남라운지하입 — 압구정 프라이빗 라운지의 숨겨진 보석',
    'gangnam-lounge-color': '강남라운지컬러 — 압구정 라운지 씬의 한 시대',
    'gangnam-lounge-arzu': '강남라운지아르쥬 — 압구정 칵테일 바의 정점',
    'gangnam-hoppa-royal': '강남호빠로얄 — 강남 프리미엄 호스트클럽의 자존심',
    'busan-hoppa-star': '부산호빠스타 — 부산 호스트 씬의 떠오르는 별',
    'jangandong-hoppa-bbangbbang': '장안동호빠빵빵 — 동북 서울의 가성비 호스트 맛집',
    'haeundae-goguryeo': '해운대고구려 — 부산 해운대 룸 60개, 비즈니스 접대의 끝판왕',
  };

  if (hooks[venue.slug]) return hooks[venue.slug] + ' ';

  // Fallback: generate from venue data
  const trait = venue.staffNickname
    ? `${venue.staffNickname}이(가) 이끄는 ${venue.regionKo}의 명소`
    : venue.isPremium
      ? `${venue.regionKo} 프리미엄 ${getCategoryKo(venue.category)}`
      : `${venue.regionKo}에서 찾은 특별한 ${getCategoryKo(venue.category)}`;

  return `${venue.nameKo} — ${trait}`;
}

function getCategoryKo(cat: string): string {
  const map: Record<string, string> = { club: 'EDM 공간', night: '밤문화 명소', lounge: '바', room: '프라이빗 공간', yojeong: '전통 문화 공간', hoppa: '호스트클럽' };
  return map[cat] || '업소';
}

export function getHookingDescription(venue: Venue): string {
  // 120자 내외, 가게이름+핵심정보
  const base = venue.shortDescription || venue.description.slice(0, 100);
  return `${venue.nameKo} — ${base}`.slice(0, 155);
}
