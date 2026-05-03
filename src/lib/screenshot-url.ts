/**
 * 스크린샷 서비스 URL 생성기
 * 모든 페이지에 이미지가 보이도록 3개 서비스 로테이션.
 *
 * - microlink.io: 무료 50회/일
 * - thum.io: 시간 두면 한도 회복
 * - screenshotone: 무료 100회/월
 */

const SITE_URL = 'https://nolcool.com';

const categoryPathMap: Record<string, string> = {
  club: 'clubs',
  night: 'nights',
  lounge: 'lounges',
  room: 'rooms',
  yojeong: 'yojeong',
  hoppa: 'hoppa',
};

function slugHash(slug: string): number {
  return slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** thum.io — 직접 이미지 반환, og:image에 최적 */
function thumUrl(pageUrl: string, w = 1200, h = 1200): string {
  return `https://image.thum.io/get/width/${w}/crop/${h}/${pageUrl}`;
}

/** microlink.io — embed=screenshot.url로 이미지 리다이렉트 */
function microlinkUrl(pageUrl: string, w = 1200, h = 1200): string {
  const params = new URLSearchParams({
    url: pageUrl,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
    'viewport.width': String(w),
    'viewport.height': String(h),
  });
  return `https://api.microlink.io/?${params.toString()}`;
}

/** screenshotone — 무료 100회/월 */
function screenshotoneUrl(pageUrl: string, w = 1200, h = 1200): string {
  const params = new URLSearchParams({
    url: pageUrl,
    viewport_width: String(w),
    viewport_height: String(h),
    format: 'jpg',
    image_quality: '80',
    block_ads: 'true',
    delay: '2',
    cache: 'true',
    cache_ttl: '86400',
  });
  return `https://api.screenshotone.com/take?${params.toString()}`;
}

/** 2개 서비스 로테이션 — slug 해시 기반
 * (screenshotone은 브라우저 ORB 차단 + CORS 정책으로 <img>에서 사용 불가) */
export function getScreenshotUrl(pageUrl: string, slug: string, w = 1200, h = 1200): string {
  const idx = slugHash(slug) % 2;
  return idx === 0 ? thumUrl(pageUrl, w, h) : microlinkUrl(pageUrl, w, h);
}

/** 업소 상세페이지 스크린샷 URL */
export function getVenueScreenshotUrl(slug: string, category: string, w = 1200, h = 1200): string {
  const catPath = categoryPathMap[category] || 'clubs';
  const pageUrl = `${SITE_URL}/${catPath}/${slug}`;
  return getScreenshotUrl(pageUrl, slug, w, h);
}

/** 특정 서비스 직접 사용 */
export function getScreenshotByService(
  pageUrl: string,
  service: 'thum' | 'microlink' | 'screenshotone',
  w = 1200,
  h = 1200,
): string {
  switch (service) {
    case 'thum': return thumUrl(pageUrl, w, h);
    case 'microlink': return microlinkUrl(pageUrl, w, h);
    case 'screenshotone': return screenshotoneUrl(pageUrl, w, h);
  }
}

/** 카테고리 페이지 스크린샷 */
export function getCategoryScreenshotUrl(category: string): string {
  const catPath = categoryPathMap[category] || 'clubs';
  return thumUrl(`${SITE_URL}/${catPath}`, 1200, 630);
}
