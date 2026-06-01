/**
 * keyword-absorb — 합성어 secondary 키워드 흡수 검사 (시즌160).
 *
 * 시즌156에서 keyword-seo-monitor 1개에 적용했던 split-keyword 흡수 로직을
 * 22개 venue keyword-watch 공용으로 분리한다.
 *
 * 사례 (시즌92 수원찬스돔나이트):
 *   primary   = "수원찬스돔나이트"   ← venue 풀네임 (브랜드 검색)
 *   secondary = "수원나이트"        ← 지역+카테고리 (일반 검색)
 *   title     = "수원찬스돔나이트 — 인계동 돔 360도 7분, ..."
 *
 * substring 매칭은 title.includes("수원나이트") = false (비연속).
 * 하지만 검색 의도는 "수원찬스돔나이트" title 안에 "수원" + "나이트" 모두 포함되어
 * Google이 "수원나이트" 검색에서도 충분히 매칭한다 (token presence).
 *
 * 흡수 규칙:
 *   1) 직접 substring 포함 → true
 *   2) secondary가 "지역명 + (나이트|클럽|호빠|룸|라운지|요정)" 합성어인 경우,
 *      text에 지역명 + 카테고리 토큰 둘 다 포함되면 흡수 인정 → true
 */

const CATEGORY_SUFFIXES = ['나이트', '클럽', '호빠', '룸', '라운지', '요정'];

export function absorbsSecondary(text, secondary) {
  if (!text || !secondary) return false;
  // 1) 직접 substring 매칭
  if (text.includes(secondary)) return true;
  // 2) 합성어 split (지역 + 카테고리 suffix)
  for (const suffix of CATEGORY_SUFFIXES) {
    if (secondary.endsWith(suffix) && secondary.length > suffix.length) {
      const region = secondary.slice(0, -suffix.length);
      if (region.length >= 1 && text.includes(region) && text.includes(suffix)) {
        return true;
      }
    }
  }
  return false;
}
