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

// 시즌78 5축 정규식 (시즌79 broadening: 한국어 고유 표현 false negative 보정)
// 아라비아 숫자 + 한국어 수사 (한/두/세/네/다섯…) + 시간 페르소나 + 의문/감탄/명령형 종결어 + 1차 디테일
export const HOOK_PATTERNS = [
  {
    axis: '숫자/구체화',
    // \d+ + 단위 35종 OR 한국어 수사(한/두/세/네/다섯…) + 단위
    re: /\d+\s*(분|년|초|시|시간|일|주|개월|회|차|호선|호점|구역|구간|개|곳|곳에|군데|명|잔|병|병째|병만|평|층|층짜리|km|m|cm|kg|g|원|위|등|등급|성|성급|점|점대|배|배수|kg대|개점|살|살짜리|단|단계|첩|코스|팀)|(?:^|\s)(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*(곳|군데|명|시간|병|잔|개|층|컷|판|판째|판만|판이|판은|판의|판도|판을|판에|판부터|판까지|평|첩|팀|코스|플로어|편|차|시|분|년|회|번|건)/g,
  },
  {
    axis: '질문/대화',
    // 의문문 + 종결 의문형(인지/맞나/이냐/거지) + 명령/권유형(해봐/가봐/봐라)
    // 한국어 boundary: \b 대신 (?=$|\s|[.,!?'"])
    re: /\?|할까|할래|려나|드려|는지|인지|이냐|이지(?=$|\s|[.,!?'"])|맞나|봤어|봐라|봐(?=$|\s|[.,!?'"])|해봐|가봐|어디|누가|뭘|뭐가|어떻|얼마|왜(?=$|\s|[.,!?'"])/g,
  },
  {
    axis: 'FOMO/부정',
    re: /모르는|모를|놓치는|놓친|놓치면|안 가본|안 가면|못 본|못 가본|못 갔던|없는|없으면|만 아는|만 모르는|뺀 사람|빼고는|아무도|밖에 없|뿐인|아닌\s|아니다|아닌가/g,
  },
  {
    axis: '1인칭/구어체',
    // 1인칭 대명사 + 구어 종결어 + 평서 단정형 (~다 끝나는 단문 OK)
    // (a) 1인칭 대명사 + 구어 종결어, (b) 평서 단정형 generic: [가-힣]2+ + 다/네 + 문장경계
    //     (이름 단어가 우연히 ~다로 끝나는 경우는 드물고, 마케팅 카피에서는 ~다 종결이 단정형 hook 구조)
    re: /더라|봤다|봤네|봤지|있잖아|솔직히|진짜|찐(?=$|\s|[.,!?'"])|내가|우리가|우리는|나만|나도|~었더|맛있다|재밌다|거든|이거든|라네|라니|이라니|이라며|[가-힣]+[다네](?=$|\s|[.,!?'"])|[가-힣]{2,}어(?=$|\s|[.,!?'"])/g,
  },
  {
    axis: '구체적 디테일',
    // 시간 페르소나(새벽/금토/주말/평일/월급날) + 동선/순간(끝나고/하산/회식/마지막) + 감각어(주황빛/노란/골목/끝/들어선)
    re: /새벽|금토|주말\s|평일|월급날|마지막|첫\s|끝나고|하산|회식|2차|뒤풀이|들어선|딱\s|바로\s|곧장|골목|모퉁이|코너|역\s앞|역 도보|역에서|입구|간판|로고|불빛|주황빛|노란|파란|붉은|어둑|살짝|가만히|구석|2층|3층|지하|옥상|루프탑/g,
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
