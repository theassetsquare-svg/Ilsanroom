
import type { VenueCategory } from '@/types';

const categoryNames: Record<VenueCategory, string> = {
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

const categoryDescriptions: Record<VenueCategory, { title: string; desc: string; ogDesc: string }> = {
  club: {
    title: '전국 EDM·힙합 파티 공간 비교',
    desc: '강남, 홍대, 이태원 등 전국 주요 도시 DJ 파티 공간을 한눈에 비교하세요. 드레스코드, 입장료, 분위기까지 솔직하게.',
    ogDesc: '강남·홍대·이태원 파티 공간 비교. 드레스코드, 입장료, 분위기 솔직 리뷰.',
  },
  night: {
    title: '소셜댄스·부킹 명소 가이드',
    desc: '전국 소셜댄스 부킹 명소를 소개합니다. 지루박, 부르스부터 라이브 밴드까지, 초보도 3분이면 적응하는 곳.',
    ogDesc: '전국 소셜댄스 부킹 명소. 초보 가이드부터 인기 업소 비교까지.',
  },
  lounge: {
    title: '분위기 좋은 바·칵테일 공간 추천',
    desc: '비즈니스 접대와 데이트에 딱 맞는 바를 찾아보세요. 시그니처 칵테일, 독립 부스, 분위기 비교.',
    ogDesc: '접대·데이트 맞춤 바. 시그니처 칵테일과 독립 부스 비교.',
  },
  room: {
    title: '프라이빗 모임 공간 비교',
    desc: '회식, 생일파티, 비즈니스 모임까지. 전국 프라이빗 공간을 인원·예산·지역별로 비교하고 예약하세요.',
    ogDesc: '회식·생일·비즈니스 맞춤 프라이빗 공간. 인원·예산별 비교.',
  },
  yojeong: {
    title: '한정식·국악 전통 접대 문화 안내',
    desc: '한정식 코스와 국악 라이브가 어우러지는 전통 접대 문화를 경험하세요. 격식 있는 비즈니스 만찬에 최적.',
    ogDesc: '한정식 코스·국악 라이브 전통 접대. 비즈니스 만찬 최적 공간.',
  },
  hoppa: {
    title: '여성 전용 사교 공간 솔직 비교',
    desc: '대화와 엔터테인먼트를 즐기는 여성 전용 사교 공간. 혼자도 편한 곳, 예산별 맞춤 추천까지.',
    ogDesc: '여성 전용 사교 공간. 혼자도 편하게, 예산별 맞춤 추천.',
  },
};

export function generateCategoryMeta(category: VenueCategory): Metadata {
  const meta = categoryDescriptions[category];
  return {
    title: meta.title,
    description: meta.desc,
    openGraph: {
      title: `${meta.title} | 밤키`,
      description: meta.ogDesc,
    },
  };
}

export function generateVenueMeta(
  venueName: string,
  regionKo: string,
  category: VenueCategory,
  description: string,
): Metadata {
  const categoryName = categoryNames[category];
  return {
    title: `${venueName} — ${regionKo} ${categoryName}`,
    description: description.slice(0, 150),
    openGraph: {
      title: `${venueName} | 밤키`,
      description: description.slice(0, 150),
    },
  };
}
