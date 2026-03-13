/**
 * SEO Engine — Primary / Secondary Keyword Utility
 *
 * Usage:
 *   const seo = require('./seo-engine');
 *   const venue = require('../data/venues/busan-yeonsan-mul-night.json');
 *   const result = seo.generate(venue);
 */

'use strict';

// ── Title Skeletons ──
// 12 unique patterns to avoid repetition across pages.
// {P} = primary, {S} = secondary, {I} = intent modifier, {R} = regionCity short
const TITLE_SKELETONS = [
  '{P} — {S} 위치·교통·분위기 종합 안내 가이드',
  '{P} | {S} 방문 전 체크리스트·교통·주차 정리',
  '{P} · {S} 공간·시설·분위기 종합 가이드 모음',
  '{P} — {R} 교통·주차·동선·분위기 안내 정리',
  '{P} | {S} 이용 가이드·FAQ·접근 동선 안내',
  '{P} · {R} 분위기·음악·문의 안내 종합 가이드',
  '{P} — {S} 종합 안내·접근법·체크리스트 정리',
  '{P} | {R} 시설·분위기·교통·동선 총정리 안내',
  '{P} · {S} 방문 가이드·체크리스트·교통 정보',
  '{P} — {R} 위치·분위기·FAQ·이용 안내 정리',
  '{P} | {S} 공간·동선·문의·방문 안내 가이드',
  '{P} · {R} 체크리스트·교통·분위기·시설 안내',
];

// ── H1 Skeletons ──
const H1_SKELETONS = [
  '{P} 종합 안내',
  '{P} 방문 가이드',
  '{P} 위치·분위기 안내',
  '{P} 공간·시설 소개',
  '{P} 교통·동선 가이드',
  '{P} 이용 안내·FAQ',
  '{P} 체크리스트·접근법',
  '{P} 시설·분위기 총정리',
  '{P} 방문 전 확인사항',
  '{P} 위치·교통 종합',
  '{P} 공간·문의 안내',
  '{P} 분위기·FAQ 가이드',
];

// ── Meta Description Templates ──
// {P} max 1 occurrence, {S} or {I} 1-2 times, 80-120 chars target
const META_SKELETONS = [
  '{P} 위치, 교통, 분위기를 한눈에 정리했습니다. {S} 방문 전 참고할 실용 정보와 체크리스트를 확인하세요. 접근 동선과 심야 주차 안내도 포함합니다.',
  '{S} 지역의 대표 장소 {P} 종합 안내. 공간 특징, 접근 동선, 문의 전 확인할 점과 방문 체크리스트를 한눈에 살펴볼 수 있습니다.',
  '{P} 방문 가이드를 제공합니다. {S} 교통·주차·분위기·시설 등 사전에 알아둘 정보를 한곳에 모았습니다. FAQ도 함께 확인하세요.',
  '{P} 공간·시설·교통 종합 안내 페이지입니다. {S} 방문 전 체크리스트, 접근 동선, FAQ를 한 페이지로 정리했습니다.',
  '{S} 대표 장소 {P}. 위치, 분위기, 접근 동선, 시설 정보를 중립적으로 정리한 정보형 가이드입니다. 방문 전 꼭 확인하세요.',
  '{P} 이용 가이드 페이지입니다. {S} 접근법, 분위기, 시설 정보를 꼼꼼히 확인한 뒤 방문을 준비하세요. 교통·주차 안내 포함.',
];

// ── JSON-LD Builder ──
function buildJsonLd(venue, title, description, pageUrl) {
  var ld = {
    '@context': 'https://schema.org',
    '@type': 'EntertainmentBusiness',
    'name': venue.storeName,
    'url': pageUrl,
    'description': description,
    'address': {},
    'geo': {},
  };

  if (venue.address) {
    ld.address = {
      '@type': 'PostalAddress',
      'streetAddress': venue.address,
      'addressLocality': venue.regionCity,
      'addressCountry': 'KR',
    };
  }

  if (venue.status === 'verified_open') {
    // Only include operational info for verified venues
    if (venue.phone) {
      ld.telephone = venue.phone;
    }
  }

  // FAQ schema if venue has FAQ data
  // Will be added by build script per-page

  return ld;
}

// ── Stable hash for skeleton selection ──
function stableIndex(str, len) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % len;
}

// ── Skeleton filler ──
function fillSkeleton(skeleton, vars) {
  var result = skeleton;
  Object.keys(vars).forEach(function (key) {
    result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), vars[key]);
  });
  return result;
}

// ── Short region name ──
function shortRegion(regionCity) {
  return regionCity
    .replace(/특별시|광역시|도$/g, '')
    .replace(/경기\s*/, '')
    .trim();
}

// ── Primary keyword counter ──
function countPrimaryKeyword(text, primary) {
  if (!primary || !text) return 0;
  var regex = new RegExp(primary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return (text.match(regex) || []).length;
}

// ── Keyword density ──
function keywordDensity(text, keyword) {
  var koreanWords = text.match(/[가-힣]{2,}/g) || [];
  var total = koreanWords.length;
  if (total === 0) return 0;
  var count = countPrimaryKeyword(text, keyword);
  return count / total;
}

// ── Main generator ──
function generate(venue, options) {
  options = options || {};
  var baseUrl = options.baseUrl || 'https://ilsanroom.pages.dev';

  var P = venue.primaryKeyword || venue.storeName;
  var S = (venue.secondaryKeywords && venue.secondaryKeywords[0]) || '';
  var R = shortRegion(venue.regionCity || '');

  // Select skeletons using stable hash (different seed per type)
  var titleIdx = stableIndex(venue.slug + '-title', TITLE_SKELETONS.length);
  var h1Idx = stableIndex(venue.slug + '-h1', H1_SKELETONS.length);
  var metaIdx = stableIndex(venue.slug + '-meta', META_SKELETONS.length);

  // Ensure h1 skeleton differs from title skeleton index
  if (h1Idx === titleIdx) {
    h1Idx = (h1Idx + 1) % H1_SKELETONS.length;
  }

  var vars = { P: P, S: S, R: R, I: '' };

  var title = fillSkeleton(TITLE_SKELETONS[titleIdx], vars);
  var h1 = fillSkeleton(H1_SKELETONS[h1Idx], vars);
  var metaDescription = fillSkeleton(META_SKELETONS[metaIdx], vars);

  // Build page URL
  var category = venue.category || 'night';
  var city = (venue.regionCity || '').replace(/특별시|광역시|도$/g, '').replace(/\s+/g, '').toLowerCase();
  // Romanize city for URL (simplified mapping)
  var citySlugMap = {
    '부산': 'busan', '서울': 'seoul', '경기수원시': 'suwon', '경기성남시': 'seongnam',
    '경기고양시': 'goyang', '경기안양시': 'anyang', '경기파주시': 'paju',
    '울산': 'ulsan', '인천': 'incheon', '대전': 'daejeon', '대구': 'daegu',
    '수원시': 'suwon', '성남시': 'seongnam', '고양시': 'goyang', '안양시': 'anyang', '파주시': 'paju',
  };
  var citySlug = citySlugMap[city] || city;

  var areaSlug = (venue.regionArea || '')
    .replace(/[구동시]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase() || 'area';

  var pageUrl = baseUrl + '/' + category + '/' + citySlug + '/' + areaSlug + '/' + venue.slug + '/';

  var canonical = pageUrl;

  var ogTags = {
    'og:type': 'article',
    'og:title': title,
    'og:description': metaDescription,
    'og:url': pageUrl,
    'og:locale': 'ko_KR',
  };

  var jsonLd = buildJsonLd(venue, title, metaDescription, pageUrl);

  return {
    title: title,
    titleLength: title.length,
    h1: h1,
    h1Length: h1.length,
    metaDescription: metaDescription,
    metaDescriptionLength: metaDescription.length,
    canonical: canonical,
    ogTags: ogTags,
    jsonLd: jsonLd,
    primaryKeyword: P,
    secondaryKeywords: venue.secondaryKeywords || [],
    intentKeywords: venue.intentKeywords || [],
    primaryInTitle: countPrimaryKeyword(title, P),
    primaryInH1: countPrimaryKeyword(h1, P),
    primaryInMeta: countPrimaryKeyword(metaDescription, P),
    pageUrl: pageUrl,
  };
}

// ── Validation ──
function validate(seoResult) {
  var errors = [];

  // Title checks
  if (!seoResult.title.startsWith(seoResult.primaryKeyword)) {
    errors.push('TITLE: must start with primary keyword');
  }
  if (seoResult.titleLength < 28) {
    errors.push('TITLE: too short (' + seoResult.titleLength + ' < 28)');
  }
  if (seoResult.titleLength > 42) {
    errors.push('TITLE: too long (' + seoResult.titleLength + ' > 42)');
  }

  // H1 checks
  if (!seoResult.h1.startsWith(seoResult.primaryKeyword)) {
    errors.push('H1: must start with primary keyword');
  }
  if (seoResult.h1 === seoResult.title) {
    errors.push('H1: must differ from title');
  }

  // Meta description checks
  if (seoResult.metaDescriptionLength < 80) {
    errors.push('META: too short (' + seoResult.metaDescriptionLength + ' < 80)');
  }
  if (seoResult.metaDescriptionLength > 120) {
    errors.push('META: too long (' + seoResult.metaDescriptionLength + ' > 120)');
  }
  if (seoResult.primaryInMeta !== 1) {
    errors.push('META: primary keyword must appear exactly 1 time (found ' + seoResult.primaryInMeta + ')');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

module.exports = {
  generate: generate,
  validate: validate,
  countPrimaryKeyword: countPrimaryKeyword,
  keywordDensity: keywordDensity,
  buildJsonLd: buildJsonLd,
  TITLE_SKELETONS: TITLE_SKELETONS,
  H1_SKELETONS: H1_SKELETONS,
  META_SKELETONS: META_SKELETONS,
};
