/**
 * useUserBlocks — 단어/닉네임 차단 (디시 검증)
 * localStorage 기반, 백엔드 0
 */
import { useCallback, useEffect, useState } from 'react';

const KEY_WORDS = 'nolcool_blocked_words';
const KEY_NAMES = 'nolcool_blocked_names';

function loadList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveList(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function useUserBlocks() {
  const [words, setWords] = useState<string[]>(() => loadList(KEY_WORDS));
  const [names, setNames] = useState<string[]>(() => loadList(KEY_NAMES));

  useEffect(() => saveList(KEY_WORDS, words), [words]);
  useEffect(() => saveList(KEY_NAMES, names), [names]);

  const addWord = useCallback((w: string) => {
    const v = w.trim();
    if (!v) return;
    setWords((prev) => (prev.includes(v) ? prev : [...prev, v]));
  }, []);

  const removeWord = useCallback((w: string) => {
    setWords((prev) => prev.filter((x) => x !== w));
  }, []);

  const addName = useCallback((n: string) => {
    const v = n.trim();
    if (!v) return;
    setNames((prev) => (prev.includes(v) ? prev : [...prev, v]));
  }, []);

  const removeName = useCallback((n: string) => {
    setNames((prev) => prev.filter((x) => x !== n));
  }, []);

  /** 본문·제목 차단 단어 포함 여부 */
  const isContentBlocked = useCallback(
    (text: string) => words.some((w) => text.includes(w)),
    [words],
  );

  /** 닉네임 차단 여부 */
  const isNameBlocked = useCallback(
    (name: string) => names.includes(name),
    [names],
  );

  return { words, names, addWord, removeWord, addName, removeName, isContentBlocked, isNameBlocked };
}
