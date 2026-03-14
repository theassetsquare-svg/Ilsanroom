// Korean profanity filter for community content
// Replaces detected profanity with asterisks

const PROFANITY_LIST = [
  // Common Korean profanity (asterisked for safety)
  '시발', '씨발', '시bal', 'ㅅㅂ', 'ㅆㅂ',
  '개새끼', '새끼', 'ㅅㄲ',
  '병신', 'ㅂㅅ', '병ㅅ',
  '지랄', 'ㅈㄹ',
  '좆', 'ㅈ같',
  '미친', '미ㅊ', 'ㅁㅊ',
  '꺼져', '닥쳐',
  '멍청', '바보',
  'fuck', 'shit', 'bitch', 'ass',
  '쓰레기', '찐따', '또라이',
  '니애미', '니엄마', '엠창',
  '느금마', '느금',
];

// Build regex patterns that handle spacing tricks (e.g. "시 발", "시.발")
function buildPattern(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Allow optional whitespace/dots between each character
  const spaced = escaped.split('').join('[\\s.·_-]*');
  return new RegExp(spaced, 'gi');
}

const PATTERNS = PROFANITY_LIST.map(buildPattern);

export interface FilterResult {
  filtered: string;
  hasProfanity: boolean;
  detectedCount: number;
  detectedWords: string[];
}

export function filterProfanity(text: string): FilterResult {
  let filtered = text;
  let detectedCount = 0;
  const detectedWords: string[] = [];

  for (let i = 0; i < PATTERNS.length; i++) {
    const pattern = PATTERNS[i];
    const matches = filtered.match(pattern);
    if (matches) {
      detectedCount += matches.length;
      detectedWords.push(PROFANITY_LIST[i]);
      filtered = filtered.replace(pattern, (match) => '⚠' + '*'.repeat(Math.max(match.length - 1, 1)));
    }
  }

  return {
    filtered,
    hasProfanity: detectedCount > 0,
    detectedCount,
    detectedWords: [...new Set(detectedWords)],
  };
}

export function containsProfanity(text: string): boolean {
  return PATTERNS.some((pattern) => pattern.test(text));
}

// Blind content (replace entire content with warning)
export function blindContent(content: string): string {
  return '⚠️ 이 콘텐츠는 커뮤니티 가이드라인 위반으로 블라인드 처리되었습니다.';
}
