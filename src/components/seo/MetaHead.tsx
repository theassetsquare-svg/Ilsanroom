import type { Metadata } from 'next';
import type { VenueCategory } from '@/types';

const categoryNames: Record<VenueCategory, string> = {
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
  collatek: '콜라텍',
};

export function generateCategoryMeta(category: VenueCategory): Metadata {
  const name = categoryNames[category];
  return {
    title: `${name} 추천 & 정보`,
    description: `대한민국 인기 ${name} 정보를 확인하세요. 지역별 ${name} 추천, 분위기, 이용 가이드, 리뷰까지 일산룸포털에서 한눈에.`,
    openGraph: {
      title: `${name} 추천 & 정보 | 일산룸포털`,
      description: `대한민국 인기 ${name} 정보를 확인하세요. 지역별 ${name} 추천, 분위기, 이용 가이드, 리뷰까지.`,
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
    description: description.slice(0, 155),
    openGraph: {
      title: `${venueName} | 일산룸포털`,
      description: description.slice(0, 155),
    },
  };
}
