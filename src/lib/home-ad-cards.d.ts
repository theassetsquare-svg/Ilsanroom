export interface HomeAdCard {
  slug: string;
  shop: string;
  cat: 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa';
  region: string;
  regionKo: string;
  href: string;
  file: string;
  img: string;
  listCard: boolean;
}
export declare const CAT_KO: Record<string, string>;
export declare function venuePath(cat: string, slug: string, region: string): string;
export declare function adCardFile(row: { slug: string; cat: string; region: string }): string;
export declare const HOME_AD_CARDS: HomeAdCard[];
export declare function homeCardImg(slug: string): string | null;
export declare function listCardImg(slug: string): string | null;
export declare function homeAdCardsToday(now?: Date): HomeAdCard[];
