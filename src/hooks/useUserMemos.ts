/**
 * useUserMemos — 닉네임 메모 (디시 검증)
 * 나만 보는 메모, localStorage 기반
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'nolcool_user_memos';

type MemoMap = Record<string, string>;

function load(): MemoMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MemoMap) : {};
  } catch {
    return {};
  }
}

function save(map: MemoMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function useUserMemos() {
  const [memos, setMemos] = useState<MemoMap>(load);

  useEffect(() => save(memos), [memos]);

  const setMemo = useCallback((nickname: string, memo: string) => {
    const name = nickname.trim();
    if (!name) return;
    setMemos((prev) => {
      const next = { ...prev };
      if (memo.trim()) next[name] = memo.trim();
      else delete next[name];
      return next;
    });
  }, []);

  const getMemo = useCallback((nickname: string) => memos[nickname] ?? '', [memos]);

  const removeMemo = useCallback((nickname: string) => {
    setMemos((prev) => {
      const next = { ...prev };
      delete next[nickname];
      return next;
    });
  }, []);

  return { memos, setMemo, getMemo, removeMemo, count: Object.keys(memos).length };
}
