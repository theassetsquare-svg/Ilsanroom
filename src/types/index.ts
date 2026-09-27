export type VenueCategory = 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa';

export interface Venue {
  id: string;
  slug: string;
  name: string;
  nameKo: string;
  category: VenueCategory;
  region: string;
  regionKo: string;
  address: string;
  description: string;
  shortDescription: string;
  features: string[];
  atmosphere: string[];
  ageGroup: string;
  dressCode: string;
  bestTime: string;
  parking: string;
  nearbyStation: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isPremium: boolean;
  isVerified: boolean;
  status: 'verified_open' | 'unknown' | 'closed_or_unclear';
  openHours: string;
  tags: string[];
  priceEntry?: string;
  priceTable?: string;
  priceDrink?: string;
  liquorInfo?: string;
  boothInfo?: string;
  roomInfo?: string;
  staffNickname?: string;
  staffPhone?: string;
  district?: string;
  lat?: number;
  lng?: number;
  /* SEO alternateName 매핑 — Google/AI 검색 동의어 인식 */
  aliases?: string[];
  /* [놀쿨12-2 · 13:18-4] 같은 가게 둘째 쪽 — 본 쪽 slug(목록·숫자에서 빠지고 쪽은 그대로 · 본 쪽으로 링크) */
  sameAs?: string;
  sameAsNote?: string;
  /* [놀쿨12-2 · 13:18-10] 개업일(사업자등록증 기준 · 가게 장부 verified) */
  openingDate?: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  category: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  date: string;
  description: string;
  imageUrl: string;
}

export type CategoryInfo = {
  key: VenueCategory;
  label: string;
  labelKo: string;
  path: string;
  icon: string;
  color: string;
  description: string;
};
