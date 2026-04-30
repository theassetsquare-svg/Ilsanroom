// 4주차: 콘텐츠 자동 필터링 시스템
// 욕설 필터 + 스팸 감지 + 이상한 글 감지
import { filterProfanity, type FilterResult } from './profanity-filter';

export type FilterAction = 'pass' | 'mask' | 'block' | 'review';

export interface ContentCheckResult {
  action: FilterAction;
  reason: string;
  filteredText: string;
  profanityResult: FilterResult;
}

// 스팸 패턴 감지
const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/gi,                    // 외부 링크
  /(?:카톡|카카오톡|텔레|텔레그램)\s*[:\-]?\s*\S+/gi, // 메신저 ID 홍보
  /(?:010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/g, // 전화번호 (스팸용)
  /(?:할인|무료|이벤트|선착순|한정).{0,10}(?:클릭|접속|가입|문의)/gi, // 광고 문구
];

// 의미 없는 글 감지
function isGibberish(text: string): boolean {
  const cleaned = text.replace(/\s+/g, '');
  if (cleaned.length < 5) return true;

  // 동일 글자 반복 (ㅋㅋㅋㅋㅋ, ㅎㅎㅎㅎ, ㅁㅁㅁㅁ 등)
  if (/^(.)\1{4,}$/.test(cleaned)) return true;

  // 자음/모음만으로 구성 (ㅁㅁㅁ, ㅋㅋ, ㅎㅎ 제외하고 의미없는 조합)
  const jamo = cleaned.replace(/[ㄱ-ㅎㅏ-ㅣ]/g, '');
  if (jamo.length === 0 && cleaned.length > 3) return true;

  return false;
}

// 동일 내용 반복 감지 (localStorage 기반)
function isRepeatedPost(content: string): boolean {
  const key = 'nolcool_recent_posts';
  try {
    const recent: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const hash = content.trim().toLowerCase().slice(0, 100);

    if (recent.includes(hash)) return true;

    recent.unshift(hash);
    localStorage.setItem(key, JSON.stringify(recent.slice(0, 20)));
  } catch { /* ignore */ }
  return false;
}

// 짧은 시간 내 다수 글 감지
function isFlood(): boolean {
  const key = 'nolcool_post_times';
  try {
    const times: number[] = JSON.parse(localStorage.getItem(key) || '[]');
    const now = Date.now();
    const recentCount = times.filter(t => now - t < 60_000).length; // 1분 내

    times.unshift(now);
    localStorage.setItem(key, JSON.stringify(times.slice(0, 50)));

    return recentCount >= 3; // 1분에 3개 이상
  } catch { return false; }
}

export function checkContent(text: string): ContentCheckResult {
  // 1. 너무 짧은 글
  if (text.trim().length < 10) {
    return {
      action: 'block',
      reason: '내용이 너무 짧습니다 (10자 이상 입력해주세요)',
      filteredText: text,
      profanityResult: { filtered: text, hasProfanity: false, detectedCount: 0, detectedWords: [] },
    };
  }

  // 2. 의미 없는 글
  if (isGibberish(text)) {
    return {
      action: 'block',
      reason: '의미 있는 내용을 입력해주세요',
      filteredText: text,
      profanityResult: { filtered: text, hasProfanity: false, detectedCount: 0, detectedWords: [] },
    };
  }

  // 3. 도배 감지
  if (isFlood()) {
    return {
      action: 'block',
      reason: '잠시 후 다시 시도해주세요 (도배 방지)',
      filteredText: text,
      profanityResult: { filtered: text, hasProfanity: false, detectedCount: 0, detectedWords: [] },
    };
  }

  // 4. 동일 내용 반복
  if (isRepeatedPost(text)) {
    return {
      action: 'block',
      reason: '동일한 내용이 이미 등록되었습니다',
      filteredText: text,
      profanityResult: { filtered: text, hasProfanity: false, detectedCount: 0, detectedWords: [] },
    };
  }

  // 5. 스팸 패턴
  const spamMatch = SPAM_PATTERNS.find(p => p.test(text));
  if (spamMatch) {
    return {
      action: 'review',
      reason: '스팸으로 의심되는 내용이 포함되어 검토가 필요합니다',
      filteredText: text,
      profanityResult: { filtered: text, hasProfanity: false, detectedCount: 0, detectedWords: [] },
    };
  }

  // 6. 욕설 필터
  const profanityResult = filterProfanity(text);
  if (profanityResult.hasProfanity) {
    return {
      action: 'mask',
      reason: `부적절한 표현이 자동 가림 처리되었습니다`,
      filteredText: profanityResult.filtered,
      profanityResult,
    };
  }

  return {
    action: 'pass',
    reason: '',
    filteredText: text,
    profanityResult,
  };
}

export function checkTitle(title: string): ContentCheckResult {
  if (title.trim().length < 2) {
    return {
      action: 'block',
      reason: '제목을 입력해주세요',
      filteredText: title,
      profanityResult: { filtered: title, hasProfanity: false, detectedCount: 0, detectedWords: [] },
    };
  }

  const profanityResult = filterProfanity(title);
  if (profanityResult.hasProfanity) {
    return {
      action: 'mask',
      reason: '제목에 부적절한 표현이 포함되어 있습니다',
      filteredText: profanityResult.filtered,
      profanityResult,
    };
  }

  return {
    action: 'pass',
    reason: '',
    filteredText: title,
    profanityResult,
  };
}
