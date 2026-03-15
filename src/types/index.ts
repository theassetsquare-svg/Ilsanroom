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
  staffNickname?: string;
  staffPhone?: string;
  district?: string;
  lat?: number;
  lng?: number;
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
