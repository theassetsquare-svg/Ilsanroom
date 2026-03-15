import type { Venue } from '@/types';

/**
 * Generate unique hooking title for each venue.
 * Format: "[가게이름] — [고유 매력 한줄] | 오늘밤어디"
 * NO duplicate titles. Each venue gets a unique hook.
 */
export function getHookingTitle(venue: Venue): string {
  // nameKo-based hooks for key venues (slug-independent)
  const hooks: Record<string, string> = {
    '일산룸': '일산룸 — 신실장이 직접 운영하는 일산 프리미엄 룸의 기준',
    '일산명월관요정': '일산명월관요정 — 15가지 한정식에 국악 라이브, 접대의 끝판왕',
    '해운대고구려': '해운대고구려 — 룸 60개, 정찰제, 비즈니스 접대의 끝판왕',
    '부산연산동물나이트': '부산연산동물나이트 — 따봉이 보장하는 연산동 밤의 열기',
    '성남샴푸나이트': '성남샴푸나이트 — 박찬호가 안내하는 성남 사교의 성지',
    '수원찬스돔나이트': '수원찬스돔나이트 — 강호동이 직접 안내하는 수원 밤의 전설',
    '수유샴푸나이트': '수유샴푸나이트 — 강북 직장인이 퇴근 후 향하는 곳',
    '신림그랑프리나이트': '신림그랑프리나이트 — 태양 실장의 관악 최고 댄스홀',
    '청담H2O나이트': '청담H2O나이트 — 워터 테마 조명과 VIP 서비스의 품격',
    '인덕원국빈관나이트': '인덕원국빈관나이트 — 안양 사교댄스의 중심지',
    '파주야당스카이돔나이트': '파주야당스카이돔나이트 — 막내가 이끄는 경기북부 최대 댄스홀',
    '울산챔피언나이트': '울산챔피언나이트 — 춘자 실장, 울산 밤의 살아있는 전설',
    '일산샴푸나이트': '일산샴푸나이트 — 주말이면 만석, 일산의 사교 클래식',
    '인천아라비안나이트': '인천아라비안나이트 — 이국적 인테리어, 인천 최대 댄스홀',
    '대전세븐나이트': '대전세븐나이트 — 7가지 테마 공간, 둔산동의 자부심',
    '상봉동한국관나이트': '상봉동한국관나이트 — 서울 동부 전통 사교의 정석',
    '강남클럽 레이스': '강남클럽 레이스 — 줄 가장 긴 EDM 파티홀, 이유가 있다',
    '압구정클럽 하입': '압구정클럽 하입 — 셀럽들의 밤, 압구정 가장 핫한 곳',
    '청담클럽 아르쥬': '청담클럽 아르쥬 — 프렌치 럭셔리, 서울 파티 씬의 정점',
    '강남호빠 로얄': '강남호빠 로얄 — 강남 프리미엄 호스트의 자존심',
    '부산호빠 스타': '부산호빠 스타 — 부산 호스트 씬의 떠오르는 별',
    '장안동호빠 빵빵': '장안동호빠 빵빵 — 웃음 빵빵, 동북 서울의 가성비 명소',
    '건대호빠 W': '건대호빠 W — 건대입구 트렌디 호스트바',
  };

  if (hooks[venue.nameKo]) return hooks[venue.nameKo];

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
