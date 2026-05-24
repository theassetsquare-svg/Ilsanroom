/**
 * 놀쿨 후킹 효과 측정 — 시즌78.
 *
 * 패러다임: 단어 화이트리스트 0개. 오직 언어 구조 패턴(5축)으로 측정.
 * 어떤 단어로 쓰든 구조 효과만 자극하면 후킹 통과 (무제한 표현 커버).
 *
 * 5축:
 *  ① 숫자/구체 시각화 — \d+ + 단위 30종+ (분/년/호선/시/명/잔 등)
 *  ② 질문/대화 — ? 어디 누가 뭘 왜 어떻 ~할까 ~할래 ~려나
 *  ③ FOMO/부정 — 안 가본 모르는 놓치는 못 본 없는 ~만 아는
 *  ④ 1인칭/구어체 — 더라 봤다 ~네 ~지 내가 우리 솔직히 있잖아
 *  ⑤ 구체적 디테일 — 한글 고유명사 + 시간/장소 컨텍스트 (옵션)
 */

export const HOOK_PATTERNS = [
  {
    axis: '숫자/구체화',
    re: /\d+\s*(분|년|초|시|시간|일|주|개월|회|차|호선|호점|구역|구간|개|곳|곳에|군데|명|잔|병|병째|병만|평|층|층짜리|km|m|cm|kg|g|원|위|등|등급|성|성급|점|점대|배|배수|kg대|개점|살|살짜리|단|단계)/g,
  },
  {
    axis: '질문/대화',
    re: /\?|할까|할래|려나|드려|는지|봤어|봐라|어디|누가|뭘|뭐가|어떻|얼마/g,
  },
  {
    axis: 'FOMO/부정',
    re: /모르는|모를|놓치는|놓친|놓치면|안 가본|안 가면|못 본|못 가본|못 갔던|없는|없으면|만 아는|만 모르는|뺀 사람|빼고는|아무도/g,
  },
  {
    axis: '1인칭/구어체',
    re: /더라|봤다|봤네|봤지|있잖아|솔직히|진짜|찐|내가|우리가|우리는|나만|나도|~지\b|~네\b|~데\b|~었더/g,
  },
];

/**
 * 텍스트의 후킹 효과 분석. 5축 정규식만 사용 (화이트리스트 0).
 * @returns { axes: {axis, hits, samples}[], axesHit: number, passed: boolean }
 */
export function analyzeHook(text) {
  const t = String(text || '');
  const axes = HOOK_PATTERNS.map(({ axis, re }) => {
    const matches = t.match(re) || [];
    return { axis, hits: matches.length, samples: [...new Set(matches)].slice(0, 3) };
  });
  const axesHit = axes.filter(a => a.hits > 0).length;
  return {
    axes,
    axesHit,
    passed: axesHit >= 1, // 5축 중 1축이라도 자극되면 후킹 통과
  };
}

/**
 * n-gram (2~5 어절) 사이트 전체 분포 — 중복 표현 감지.
 * @param texts {string[]}
 * @param overThreshold {number} — 임계 (기본 5)
 * @returns {{phrase: string, count: number, urls?: string[]}[]}
 */
export function ngramOverused(texts, urls = null, overThreshold = 5, minN = 3, maxN = 5) {
  const counter = new Map(); // phrase → { count, urls: Set }
  texts.forEach((text, i) => {
    if (!text) return;
    // title의 hook 부분 (— 이후 또는 전체)
    const after = (text.split(/[—\-:|]/).pop() || text).trim();
    const tokens = after.replace(/[.,!?]/g, ' ').split(/\s+/).filter(Boolean);
    for (let n = minN; n <= maxN; n++) {
      for (let j = 0; j + n <= tokens.length; j++) {
        const phrase = tokens.slice(j, j + n).join(' ');
        if (phrase.length < 6) continue; // 너무 짧은 건 noise
        if (!counter.has(phrase)) counter.set(phrase, { count: 0, urls: new Set() });
        const e = counter.get(phrase);
        e.count++;
        if (urls && urls[i]) e.urls.add(urls[i]);
      }
    }
  });
  return [...counter.entries()]
    .filter(([, e]) => e.count > overThreshold)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([phrase, e]) => ({ phrase, count: e.count, urls: [...e.urls].slice(0, 5) }));
}

/**
 * 단일 페이지 후킹 점수 — venue watch에서 사용.
 * 5축 중 1축이라도 매칭되면 통과.
 */
export function hookPassed(text) {
  return analyzeHook(text).passed;
}
