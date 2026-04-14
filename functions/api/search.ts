/**
 * 검색 API — 정적 데이터 기반 서버사이드 검색
 * GET /api/search?q=키워드&category=club&region=강남&limit=10&offset=0
 *
 * 환경변수: 없음 (정적 데이터 기반, 추후 DB 연결 시 추가)
 *
 * Response: {
 *   results: Venue[],
 *   total: number,
 *   query: string,
 *   filters: { category, region },
 *   took: number (ms)
 * }
 */

interface Venue {
  id: string;
  slug: string;
  name: string;
  nameKo: string;
  category: string;
  region: string;
  regionKo: string;
  shortDescription: string;
  rating: number;
  reviewCount: number;
  isPremium: boolean;
  isVerified: boolean;
  status: string;
  tags: string[];
  features: string[];
  atmosphere: string[];
  ageGroup: string;
  dressCode: string;
  bestTime: string;
  nearbyStation: string;
}

// Inline venue data for serverless (no filesystem access)
// This will be replaced with DB query when Supabase/D1 is connected
let venuesCache: Venue[] | null = null;

async function getVenues(): Promise<Venue[]> {
  if (venuesCache) return venuesCache;

  // For now, return empty — frontend sends venue data with search request
  // In production, connect to D1/KV/Supabase here
  return [];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
}

function scoreVenue(venue: Venue, query: string, category?: string, region?: string): number {
  const q = normalize(query);
  const nameKo = normalize(venue.nameKo || '');
  const nameEn = normalize(venue.name || '');
  const regionKo = normalize(venue.regionKo || '');
  let score = 0;

  // 1. Exact or Prefix Match (Highest Priority)
  if (nameKo === q) score += 1000;
  if (nameKo.startsWith(q)) score += 500;
  if (nameEn === q) score += 800;

  // 2. Contains Match
  if (nameKo.includes(q)) score += 200;
  if (nameEn.includes(q)) score += 150;

  // 3. Region Match
  if (regionKo === q) score += 400;
  if (regionKo.includes(q)) score += 100;
  if (region && (venue.region === region || normalize(venue.regionKo) === normalize(region))) score += 50;

  // 4. Category Match
  if (category && venue.category === category) score += 30;

  // 5. Tags & Features
  if (venue.tags?.some((t) => normalize(t).includes(q))) score += 80;
  if (venue.features?.some((f) => normalize(f).includes(q))) score += 40;
  if (venue.atmosphere?.some((a) => normalize(a).includes(q))) score += 30;

  // 6. Metadata & Quality
  if (venue.isPremium) score += 50;
  score += (venue.rating || 0) * 5;
  score += (venue.reviewCount || 0) * 0.1;

  // 7. Proximity to station
  if (venue.nearbyStation && normalize(venue.nearbyStation).includes(q)) score += 60;

  return score;
}

export const onRequestGet: PagesFunction = async (context) => {
  const start = Date.now();
  const url = new URL(context.request.url);

  const q = url.searchParams.get('q')?.trim() || '';
  const category = url.searchParams.get('category') || undefined;
  const region = url.searchParams.get('region') || undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const venues = await getVenues();

  // If no server-side data, return error or empty
  if (venues.length === 0) {
    return Response.json({
      results: [],
      total: 0,
      query: q,
      took: Date.now() - start,
      message: 'No data available on server.',
    });
  }

  let filtered = venues.filter((v) => v.status !== 'closed_or_unclear');

  if (category && category !== 'all') {
    filtered = filtered.filter((v) => v.category === category);
  }

  if (region && region !== 'all') {
    filtered = filtered.filter(
      (v) => v.region === region || normalize(v.regionKo) === normalize(region)
    );
  }

  let scored = filtered.map((v) => ({
    venue: v,
    score: q ? scoreVenue(v, q, category, region) : (v.rating * 10 + (v.isPremium ? 50 : 0)),
  }));

  if (q) {
    scored = scored.filter((s) => s.score > 0);
  }

  scored.sort((a, b) => b.score - a.score);

  const total = scored.length;
  const results = scored.slice(offset, offset + limit).map((s) => ({
    ...s.venue,
    _score: s.score,
  }));

  return Response.json({
    results,
    total,
    query: q,
    took: Date.now() - start,
  }, {
    headers: {
      'Cache-Control': q ? 'public, max-age=60' : 'public, max-age=300',
    },
  });
};

// POST version for sending venue data from client (hybrid approach)
export const onRequestPost: PagesFunction = async (context) => {
  const start = Date.now();

  let body: { q?: string; category?: string; region?: string; limit?: number; venues?: Venue[] };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { q = '', category, region, limit = 10, venues = [] } = body;

  if (!q && !category && !region) {
    return Response.json({ error: '검색 조건을 입력해주세요.' }, { status: 400 });
  }

  let filtered = venues.filter((v: Venue) => v.status !== 'closed_or_unclear');

  if (category) {
    filtered = filtered.filter((v: Venue) => v.category === category);
  }

  if (region) {
    filtered = filtered.filter(
      (v: Venue) => v.region === region || normalize(v.regionKo) === normalize(region)
    );
  }

  let scored = filtered.map((v: Venue) => ({
    venue: v,
    score: q ? scoreVenue(v, q, category, region) : v.rating * 10,
  }));

  if (q) {
    scored = scored.filter((s) => s.score > 0);
  }

  scored.sort((a, b) => b.score - a.score);

  const total = scored.length;
  const results = scored.slice(0, Math.min(limit, 50)).map((s) => ({
    ...s.venue,
    _score: s.score,
  }));

  return Response.json({
    results,
    total,
    query: q,
    filters: { category, region },
    took: Date.now() - start,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
};
