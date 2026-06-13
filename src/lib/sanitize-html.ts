import DOMPurify from 'dompurify';

/**
 * 사용자/매거진 작성 리치 HTML을 dangerouslySetInnerHTML로 렌더하기 전 정화.
 * <script>·on* 이벤트핸들러·javascript: URL 등 XSS 벡터를 제거하고
 * 서식 태그(b/i/a/p/ul/li/h2 등)만 통과시킨다. 클라이언트 전용(브라우저 DOM).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style'],
  });
}

/** 일반 텍스트의 HTML 특수문자를 이스케이프 (검색어 하이라이트 등). */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}
