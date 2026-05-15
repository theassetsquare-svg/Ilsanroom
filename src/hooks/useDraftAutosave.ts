/**
 * useDraftAutosave — 글쓰기 임시저장 (localStorage)
 * 영역 L-9 (시즌39) — 모달 열릴 때 자동 복원, 입력 시 600ms debounce 저장, 제출 성공 시 clear
 * 백엔드 0 — 본인 디바이스에서만 보존
 */
import { useEffect, useRef, useCallback } from 'react';

interface UseDraftAutosaveArgs {
  /** localStorage 키 suffix. 페이지마다 고유해야 함 (예: 'free', 'qna') */
  key: string;
  /** 현재 모달 열림 상태 — 닫혔다 열릴 때 복원 트리거 */
  isOpen: boolean;
  /** 현재 제목 값 */
  title: string;
  /** 현재 본문 값 */
  content: string;
  /** 제목 setter (복원 시 호출) */
  setTitle: (s: string) => void;
  /** 본문 setter (복원 시 호출) */
  setContent: (s: string) => void;
}

interface UseDraftAutosaveResult {
  /** 제출 성공 시 호출 — localStorage 키 제거 */
  clearDraft: () => void;
}

const PREFIX = 'nolcool_draft_';

export function useDraftAutosave({
  key,
  isOpen,
  title,
  content,
  setTitle,
  setContent,
}: UseDraftAutosaveArgs): UseDraftAutosaveResult {
  const storageKey = `${PREFIX}${key}`;
  const restoredRef = useRef(false);

  // 모달 열림 → 1회만 복원
  useEffect(() => {
    if (!isOpen) {
      restoredRef.current = false;
      return;
    }
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft?.title === 'string' && draft.title.length > 0) setTitle(draft.title);
      if (typeof draft?.content === 'string' && draft.content.length > 0) setContent(draft.content);
    } catch {
      // 파싱 실패는 조용히 무시
    }
  }, [isOpen, storageKey, setTitle, setContent]);

  // 입력 변경 → 600ms debounce 저장
  useEffect(() => {
    if (!isOpen) return;
    if (!title && !content) return;
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ title, content, savedAt: Date.now() }));
      } catch {
        // QuotaExceeded 등 조용히 무시
      }
    }, 600);
    return () => window.clearTimeout(handle);
  }, [isOpen, title, content, storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return { clearDraft };
}
