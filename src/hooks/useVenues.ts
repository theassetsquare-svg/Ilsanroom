import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { venues as localVenues, getVenuesByCategory as getLocalByCategory, getVenueBySlug as getLocalBySlug } from '@/data/venues';
import type { Venue, VenueCategory } from '@/types';
import type { DbVenue } from '@/types/database';

/** DB row → 프론트엔드 Venue 타입 변환 */
function dbToVenue(row: DbVenue): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameKo: row.name_ko,
    category: row.category,
    region: row.region,
    regionKo: row.region_ko,
    address: row.address || '',
    description: row.description || '',
    shortDescription: row.short_description || '',
    features: row.features || [],
    atmosphere: row.atmosphere || [],
    ageGroup: row.age_group || '',
    dressCode: row.dress_code || '',
    bestTime: row.best_time || '',
    parking: row.parking || '',
    nearbyStation: row.nearby_station || '',
    imageUrl: row.image_url || '',
    rating: row.rating,
    reviewCount: row.review_count,
    isPremium: row.is_premium,
    isVerified: row.is_verified,
    status: row.status as Venue['status'],
    openHours: row.open_hours || '',
    tags: row.tags || [],
    liquorInfo: row.liquor_info || undefined,
    boothInfo: row.booth_info || undefined,
    roomInfo: row.room_info || undefined,
    staffNickname: row.staff_nickname || undefined,
    staffPhone: row.staff_phone || undefined,
    district: row.district || undefined,
  };
}

/** 카테고리별 가게 목록 (Supabase 우선 → 로컬 폴백) */
export function useVenuesByCategory(category: VenueCategory) {
  const [venues, setVenues] = useState<Venue[]>(() => getLocalByCategory(category));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('venues')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .neq('status', 'closed_or_unclear')
      .order('is_premium', { ascending: false })
      .order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setVenues((data as DbVenue[]).map(dbToVenue));
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [category]);

  return { venues, loading };
}

/** 단일 가게 (slug 기반) */
export function useVenueBySlug(slug: string) {
  const [venue, setVenue] = useState<Venue | null>(() => getLocalBySlug(slug) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('venues')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setVenue(dbToVenue(data as DbVenue));
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { venue, loading };
}

/** 인기 가게 TOP N */
export function usePopularVenues(count = 10) {
  const [venues, setVenues] = useState<Venue[]>(() =>
    localVenues.filter(v => v.status !== 'closed_or_unclear').slice(0, count)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .neq('status', 'closed_or_unclear')
      .order('view_count', { ascending: false })
      .limit(count)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setVenues((data as DbVenue[]).map(dbToVenue));
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [count]);

  return { venues, loading };
}

/** 검색 */
export function useSearchVenues(query: string, category?: VenueCategory, region?: string) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query && !category && !region) {
      setVenues([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      // 로컬 폴백 검색
      let results = localVenues.filter(v => v.status !== 'closed_or_unclear');
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(v =>
          v.name.toLowerCase().includes(q) ||
          v.nameKo.toLowerCase().includes(q) ||
          v.regionKo.toLowerCase().includes(q) ||
          v.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      if (category) results = results.filter(v => v.category === category);
      if (region) results = results.filter(v => v.region === region || v.regionKo === region);
      setVenues(results);
      setLoading(false);
      return;
    }

    let builder = supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .neq('status', 'closed_or_unclear');

    if (query) {
      builder = builder.or(`name.ilike.%${query}%,name_ko.ilike.%${query}%,region_ko.ilike.%${query}%,tags.cs.{${query}}`);
    }
    if (category) builder = builder.eq('category', category);
    if (region) builder = builder.or(`region.eq.${region},region_ko.eq.${region}`);

    builder
      .order('is_premium', { ascending: false })
      .order('rating', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setVenues((data as DbVenue[]).map(dbToVenue));
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query, category, region]);

  return { venues, loading };
}
