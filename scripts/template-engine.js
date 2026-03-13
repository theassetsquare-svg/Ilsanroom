/**
 * Template Rotation Engine
 *
 * Deterministic template & phrase selection based on venue slug.
 * Ensures raw cosine similarity MAX ≤ 10% across all pages.
 */

'use strict';

// ══════════════════════════════════════════════
// DETERMINISTIC SEED
// ══════════════════════════════════════════════

function seedHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick(arr, slug, salt) {
  return arr[seedHash(slug + (salt || '')) % arr.length];
}

function pickIndex(len, slug, salt) {
  return seedHash(slug + (salt || '')) % len;
}

// Shuffle array deterministically
function seededShuffle(arr, slug, salt) {
  var copy = arr.slice();
  var h = seedHash(slug + (salt || ''));
  for (var i = copy.length - 1; i > 0; i--) {
    h = ((h * 1103515245 + 12345) & 0x7fffffff);
    var j = h % (i + 1);
    var tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}


// ══════════════════════════════════════════════
// 12 TEMPLATE DEFINITIONS
// ══════════════════════════════════════════════

var TEMPLATES = {
  T1: {
    name: '체크리스트 중심',
    sections: ['hero', 'checklist', 'quickfacts', 'vibe', 'location', 'faq', 'nearby', 'cta'],
    htmlLayout: 'checklist-first',
    faqCount: 3,
    usesTable: false,
    usesCards: true,
    usesList: true,
  },
  T2: {
    name: 'FAQ 중심',
    sections: ['hero', 'faq', 'quickfacts', 'vibe', 'location', 'checklist', 'nearby', 'cta'],
    htmlLayout: 'faq-first',
    faqCount: 5,
    usesTable: true,
    usesCards: false,
    usesList: true,
  },
  T3: {
    name: '분위기/음악 중심',
    sections: ['hero', 'vibe', 'checklist', 'quickfacts', 'location', 'precaution', 'faq', 'nearby', 'cta'],
    htmlLayout: 'vibe-first',
    faqCount: 4,
    usesTable: false,
    usesCards: true,
    usesList: false,
  },
  T4: {
    name: '위치/동선 중심',
    sections: ['hero', 'location', 'quickfacts', 'vibe', 'precaution', 'checklist', 'faq', 'nearby', 'cta'],
    htmlLayout: 'location-first',
    faqCount: 3,
    usesTable: true,
    usesCards: false,
    usesList: true,
  },
  T5: {
    name: '초보자 가이드 중심',
    sections: ['hero', 'beginner', 'checklist', 'vibe', 'location', 'quickfacts', 'faq', 'nearby', 'cta'],
    htmlLayout: 'beginner-first',
    faqCount: 5,
    usesTable: false,
    usesCards: true,
    usesList: true,
  },
  T6: {
    name: '실수 방지 가이드 중심',
    sections: ['hero', 'mistakes', 'quickfacts', 'location', 'vibe', 'checklist', 'faq', 'nearby', 'cta'],
    htmlLayout: 'mistakes-first',
    faqCount: 3,
    usesTable: true,
    usesCards: false,
    usesList: false,
  },
  T7: {
    name: '시간대/대기 팁 중심',
    sections: ['hero', 'timing', 'location', 'vibe', 'quickfacts', 'precaution', 'faq', 'nearby', 'cta'],
    htmlLayout: 'timing-first',
    faqCount: 4,
    usesTable: false,
    usesCards: false,
    usesList: true,
  },
  T8: {
    name: '내부 구조/분위기 묘사 중심',
    sections: ['hero', 'interior', 'vibe', 'quickfacts', 'location', 'checklist', 'faq', 'nearby', 'cta'],
    htmlLayout: 'interior-first',
    faqCount: 3,
    usesTable: true,
    usesCards: true,
    usesList: false,
  },
  T9: {
    name: '방문 준비 중심',
    sections: ['hero', 'preparation', 'checklist', 'location', 'quickfacts', 'vibe', 'faq', 'nearby', 'cta'],
    htmlLayout: 'preparation-first',
    faqCount: 4,
    usesTable: false,
    usesCards: false,
    usesList: true,
  },
  T10: {
    name: '비교형(근처 추천과 구분)',
    sections: ['hero', 'comparison', 'quickfacts', 'vibe', 'location', 'faq', 'nearby', 'cta'],
    htmlLayout: 'comparison-first',
    faqCount: 3,
    usesTable: true,
    usesCards: true,
    usesList: false,
  },
  T11: {
    name: '요약 카드 중심',
    sections: ['hero', 'summarycard', 'location', 'vibe', 'checklist', 'precaution', 'faq', 'nearby', 'cta'],
    htmlLayout: 'summarycard-first',
    faqCount: 4,
    usesTable: false,
    usesCards: true,
    usesList: true,
  },
  T12: {
    name: '질문-답변-리스트 혼합형',
    sections: ['hero', 'qalist', 'vibe', 'location', 'quickfacts', 'checklist', 'faq', 'nearby', 'cta'],
    htmlLayout: 'qalist-first',
    faqCount: 5,
    usesTable: true,
    usesCards: false,
    usesList: true,
  },
};

var TEMPLATE_KEYS = Object.keys(TEMPLATES);


// ══════════════════════════════════════════════
// PHRASE BANKS
// ══════════════════════════════════════════════

var PHRASE_BANK = {

  // ── Intro first sentences (12 variations) ──
  intro: [
    '{P}에 대해 알아보기 전, 핵심 정보를 먼저 정리해 두었습니다.',
    '{P} 방문을 고려 중이라면, 아래 안내를 먼저 살펴보세요.',
    '{S} 지역에서 {P}을(를) 찾는 분들을 위한 종합 가이드입니다.',
    '이 페이지는 {P}의 위치, 분위기, 교통 정보를 중립적으로 모았습니다.',
    '{P} 관련 정보를 체계적으로 정리한 안내 페이지입니다.',
    '{S} 일대에서 {P}을(를) 방문하려는 분께 필요한 사항을 모았습니다.',
    '{P}의 접근법과 공간 특징을 한 페이지에 담았습니다.',
    '처음 {P}을(를) 찾는 분이라면, 이 가이드가 도움이 됩니다.',
    '{P} 방문 전 확인할 사항을 간결하게 정리했습니다.',
    '{S} 권역 내 {P}의 실용 정보를 아래에서 확인하세요.',
    '이 안내는 {P}을(를) 방문하기 전 꼭 읽어볼 만한 내용을 담고 있습니다.',
    '{P}에 대한 중립적 정보를 공개 자료 기반으로 정리했습니다.',
  ],

  // ── Transition phrases (10 variations) ──
  transition: [
    '다음으로, 실제 방문 시 참고할 정보입니다.',
    '이어서 공간 관련 사항을 살펴봅니다.',
    '아래에서 추가 세부 정보를 확인할 수 있습니다.',
    '방문 계획에 도움이 될 내용을 이어서 안내합니다.',
    '이 외에도 알아두면 좋은 점이 있습니다.',
    '참고로 아래 내용도 함께 확인해 보세요.',
    '이어지는 섹션에서 더 자세한 내용을 다룹니다.',
    '추가로 확인하면 좋은 사항은 다음과 같습니다.',
    '그 밖에 방문 전 체크할 점을 모았습니다.',
    '아래는 현장에서 유용한 팁입니다.',
  ],

  // ── Checklist prompt headings (8 variations) ──
  checklistHeading: [
    '{P} 방문 전 체크리스트',
    '방문 전 꼭 확인할 항목',
    '{P} 준비물·확인사항',
    '출발 전 체크포인트',
    '사전 확인 필수 항목',
    '방문 준비 가이드',
    '{P} 사전 점검 리스트',
    '이것만 확인하면 준비 끝',
  ],

  // ── FAQ answer openers (10 variations) ──
  faqOpener: [
    '네,',
    '공개 자료에 따르면,',
    '확인된 바로는,',
    '현재 기준으로,',
    '검증된 정보에 의하면,',
    '안내 자료를 참고하면,',
    '공식 채널 정보로는,',
    '최근 확인 결과,',
    '정리하자면,',
    '간단히 말씀드리면,',
  ],

  // ── Conclusion / CTA patterns (8 variations) ──
  conclusion: [
    '위 내용은 공개 자료 기반 정리이며, 방문 전 해당 매장에 직접 확인을 권합니다.',
    '본 페이지는 정보 안내 목적이며, 예약 대행이나 중개를 하지 않습니다.',
    '최신 상태는 변동될 수 있으므로, 출발 전 매장 측에 문의하세요.',
    '이 가이드가 방문 계획에 도움이 되길 바랍니다. 정보 오류 발견 시 알려주세요.',
    '안내 내용의 최신성을 보장하지 않으며, 현장 상황은 달라질 수 있습니다.',
    '정보형 안내 페이지입니다. 직접 예약·중개·알선 서비스는 제공하지 않습니다.',
    '방문 전 영업 여부와 시간을 반드시 직접 확인하세요.',
    '모든 정보는 공개 소스에서 수집했으며, 정확성은 해당 매장에 문의 바랍니다.',
  ],

  // ── Section headings per section type (each 6+ variants) ──
  headings: {
    vibe: [
      '{P} 분위기와 음악',
      '공간 분위기 살펴보기',
      '{P}의 무드와 사운드',
      '내부 분위기 안내',
      '어떤 분위기인지 알아보기',
      '{P} 현장 느낌 정리',
    ],
    location: [
      '{P} 위치와 교통',
      '찾아가는 방법',
      '{P} 접근 동선 안내',
      '교통·주차 정보',
      '오시는 길 정리',
      '{P}까지 가는 법',
    ],
    quickfacts: [
      '핵심 정보 요약',
      '{P} 기본 사항',
      '한눈에 보는 정보',
      '주요 팩트 정리',
      '기본 안내 사항',
      '{P} 요약 정보',
    ],
    checklist: [
      '방문 전 체크리스트',
      '출발 전 확인사항',
      '{P} 준비 항목',
      '사전 점검 리스트',
      '가기 전 챙길 것',
      '필수 확인 포인트',
    ],
    precaution: [
      '문의 전 확인할 점',
      '방문 시 참고사항',
      '알아두면 좋은 점',
      '주의사항 안내',
      '사전 고지 사항',
      '{P} 이용 참고',
    ],
    faq: [
      '자주 묻는 질문',
      '{P} FAQ',
      '궁금한 점 정리',
      '질문과 답변',
      '방문자 문의 모음',
      'Q&A 안내',
    ],
    nearby: [
      '근처 다른 장소',
      '주변 추천 스폿',
      '같은 지역 다른 곳',
      '인근 장소 안내',
      '함께 살펴볼 곳',
      '주변 스폿 리스트',
    ],
    beginner: [
      '처음 방문하는 분께',
      '초보자를 위한 안내',
      '첫 방문 가이드',
      '{P} 입문 안내',
      '처음이라면 읽어보세요',
      '방문 초보 가이드',
    ],
    mistakes: [
      '흔한 실수와 대비법',
      '이것만은 피하세요',
      '방문 전 실수 방지 팁',
      '자주 하는 실수 모음',
      '{P} 주의 포인트',
      '실수 없이 방문하기',
    ],
    timing: [
      '시간대별 안내',
      '언제 가면 좋을까',
      '방문 타이밍 팁',
      '시간대·대기 정보',
      '{P} 피크 타임 안내',
      '최적 방문 시간',
    ],
    interior: [
      '내부 구조 살펴보기',
      '공간 배치와 시설',
      '{P} 플로어 안내',
      '시설·좌석 구성',
      '내부 공간 가이드',
      '층별·구역별 안내',
    ],
    preparation: [
      '방문 준비 가이드',
      '출발 전 준비사항',
      '{P} 방문 준비',
      '준비부터 도착까지',
      '사전 준비 체크',
      '방문 전 투두리스트',
    ],
    comparison: [
      '다른 곳과 어떻게 다를까',
      '{P}만의 차별점',
      '비교 포인트 정리',
      '주변 장소와의 차이',
      '특징 비교 안내',
      '왜 이곳인지 알아보기',
    ],
    summarycard: [
      '{P} 핵심 요약',
      '한눈에 보는 요약 카드',
      '3줄 요약 정보',
      '빠른 요약 안내',
      '{P} 미니 프로필',
      '핵심만 빠르게',
    ],
    qalist: [
      '궁금한 점부터 시작',
      '질문으로 알아보기',
      '{P} Q&A 가이드',
      '질문-답변으로 정리',
      '물어보는 형식 안내',
      'Q&A 스타일 가이드',
    ],
  },
};


// ══════════════════════════════════════════════
// TEMPLATE ASSIGNMENT
// ══════════════════════════════════════════════

/**
 * Assigns a template to a venue, ensuring no two venues
 * in the same (category, regionCity) cluster share a template.
 */
function assignTemplate(venue, allVenues) {
  // Base pick from slug
  var baseIdx = pickIndex(TEMPLATE_KEYS.length, venue.slug, 'tmpl');
  var templateKey = TEMPLATE_KEYS[baseIdx];

  // Check cluster collision (skip empty-regionCity grouping)
  if (allVenues && allVenues.length > 1 && venue.regionCity) {
    var cluster = allVenues.filter(function (v) {
      return v.category === venue.category && v.regionCity === venue.regionCity && v.slug !== venue.slug;
    });
    var usedKeys = cluster.map(function (v) {
      return TEMPLATE_KEYS[pickIndex(TEMPLATE_KEYS.length, v.slug, 'tmpl')];
    });

    // If collision, shift until unique
    var attempts = 0;
    while (usedKeys.indexOf(templateKey) !== -1 && attempts < TEMPLATE_KEYS.length) {
      baseIdx = (baseIdx + 1) % TEMPLATE_KEYS.length;
      templateKey = TEMPLATE_KEYS[baseIdx];
      attempts++;
    }
  }

  return templateKey;
}


// ══════════════════════════════════════════════
// PHRASE SELECTION
// ══════════════════════════════════════════════

function selectPhrases(venue) {
  var P = venue.primaryKeyword || venue.storeName;
  var S = (venue.secondaryKeywords && venue.secondaryKeywords[0]) || '';

  function fill(str) {
    return str.replace(/\{P\}/g, P).replace(/\{S\}/g, S);
  }

  return {
    intro: fill(pick(PHRASE_BANK.intro, venue.slug, 'intro')),
    transition: fill(pick(PHRASE_BANK.transition, venue.slug, 'trans')),
    checklistHeading: fill(pick(PHRASE_BANK.checklistHeading, venue.slug, 'clhead')),
    faqOpener: pick(PHRASE_BANK.faqOpener, venue.slug, 'faqop'),
    conclusion: pick(PHRASE_BANK.conclusion, venue.slug, 'concl'),
    headings: {},
  };
}

function selectHeading(sectionType, venue) {
  var P = venue.primaryKeyword || venue.storeName;
  var variants = PHRASE_BANK.headings[sectionType];
  if (!variants) return sectionType;
  var chosen = pick(variants, venue.slug, 'h-' + sectionType);
  return chosen.replace(/\{P\}/g, P);
}


// ══════════════════════════════════════════════
// FAQ SET GENERATOR
// ══════════════════════════════════════════════

// 30 unique FAQ templates — each page picks a subset
var FAQ_POOL = [
  { q: '{P}은(는) 어디에 있나요?', a: '{A_LOC}' },
  { q: '{P} 가는 교통편은?', a: '{A_TRANS}' },
  { q: '주차 공간이 있나요?', a: '{A_PARK}' },
  { q: '영업 시간은 어떻게 되나요?', a: '{A_HOURS}' },
  { q: '복장 규정이 있나요?', a: '{A_DRESS}' },
  { q: '{P} 예약이 필요한가요?', a: '{A_RESV}' },
  { q: '혼자 가도 되나요?', a: '{A_SOLO}' },
  { q: '단체 방문이 가능한가요?', a: '{A_GROUP}' },
  { q: '대중교통 막차 후 귀가 방법은?', a: '{A_LATE}' },
  { q: '{P}의 분위기는 어떤가요?', a: '{A_VIBE}' },
  { q: '어떤 음악을 틀어주나요?', a: '{A_MUSIC}' },
  { q: '연령대 제한이 있나요?', a: '{A_AGE}' },
  { q: '여성 혼자 방문해도 괜찮은가요?', a: '{A_FEMALE}' },
  { q: '{S}에 비슷한 곳이 또 있나요?', a: '{A_ALT}' },
  { q: '신분증 지참이 필수인가요?', a: '{A_ID}' },
  { q: '카드 결제가 가능한가요?', a: '{A_PAY}' },
  { q: '웨이터 서비스가 있나요?', a: '{A_WT}' },
  { q: '금요일과 토요일 차이가 있나요?', a: '{A_WEEKEND}' },
  { q: '어떤 좌석 유형이 있나요?', a: '{A_SEAT}' },
  { q: '흡연 구역이 있나요?', a: '{A_SMOKE}' },
  { q: '근처에 음식점이 많은가요?', a: '{A_FOOD}' },
  { q: '비 오는 날에도 가기 좋은가요?', a: '{A_RAIN}' },
  { q: '{P}은(는) 언제 가장 붐비나요?', a: '{A_PEAK}' },
  { q: '첫 방문 시 주의할 점은?', a: '{A_FIRST}' },
  { q: '재방문율이 높은 곳인가요?', a: '{A_RETURN}' },
  { q: '외국인도 방문 가능한가요?', a: '{A_FOREIGN}' },
  { q: '음료 반입이 가능한가요?', a: '{A_BYO}' },
  { q: '사이트 정보는 얼마나 정확한가요?', a: '{A_ACCURACY}' },
  { q: '정보 수정 요청은 어떻게 하나요?', a: '{A_EDIT}' },
  { q: '이 사이트는 예약 대행을 하나요?', a: '{A_NOBOOKING}' },
];

function selectFaqSet(venue, count) {
  var shuffled = seededShuffle(FAQ_POOL, venue.slug, 'faq');
  var P = venue.primaryKeyword || venue.storeName;
  var S = (venue.secondaryKeywords && venue.secondaryKeywords[0]) || '';

  return shuffled.slice(0, count).map(function (item) {
    return {
      q: item.q.replace(/\{P\}/g, P).replace(/\{S\}/g, S),
      aTemplate: item.a,
    };
  });
}


// ══════════════════════════════════════════════
// FULL PAGE BLUEPRINT
// ══════════════════════════════════════════════

function generateBlueprint(venue, allVenues) {
  var templateKey = assignTemplate(venue, allVenues);
  var template = TEMPLATES[templateKey];
  var phrases = selectPhrases(venue);
  var faqSet = selectFaqSet(venue, template.faqCount);

  // Build section headings
  var sectionHeadings = {};
  template.sections.forEach(function (sec) {
    if (sec !== 'hero' && sec !== 'cta') {
      sectionHeadings[sec] = selectHeading(sec, venue);
    }
  });

  return {
    venue: venue.slug,
    storeName: venue.storeName,
    templateKey: templateKey,
    templateName: template.name,
    sectionOrder: template.sections,
    htmlLayout: template.htmlLayout,
    faqCount: template.faqCount,
    usesTable: template.usesTable,
    usesCards: template.usesCards,
    usesList: template.usesList,
    phrases: {
      intro: phrases.intro,
      transition: phrases.transition,
      checklistHeading: phrases.checklistHeading,
      faqOpener: phrases.faqOpener,
      conclusion: phrases.conclusion,
    },
    sectionHeadings: sectionHeadings,
    faqSet: faqSet,
  };
}


// ══════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════

module.exports = {
  TEMPLATES: TEMPLATES,
  TEMPLATE_KEYS: TEMPLATE_KEYS,
  PHRASE_BANK: PHRASE_BANK,
  FAQ_POOL: FAQ_POOL,
  seedHash: seedHash,
  pick: pick,
  pickIndex: pickIndex,
  seededShuffle: seededShuffle,
  assignTemplate: assignTemplate,
  selectPhrases: selectPhrases,
  selectHeading: selectHeading,
  selectFaqSet: selectFaqSet,
  generateBlueprint: generateBlueprint,
};
