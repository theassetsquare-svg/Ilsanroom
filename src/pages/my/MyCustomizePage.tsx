/**
 * MyCustomizePage — 디시 검증 기능 (차단·메모·보관함·최근 본 글)
 * 영역 L (시즌37) — localStorage 기반, 백엔드 0
 */
import { useState } from 'react';
import { Link } from '@/components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useUserBlocks } from '@/hooks/useUserBlocks';
import { useUserMemos } from '@/hooks/useUserMemos';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useRecentPosts } from '@/hooks/useRecentPosts';
import DailyPrompt from '@/components/community/DailyPrompt';

type Tab = 'block' | 'memo' | 'bookmark' | 'recent';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'block', label: '차단', emoji: '🚫' },
  { key: 'memo', label: '닉네임 메모', emoji: '📝' },
  { key: 'bookmark', label: '보관함', emoji: '📌' },
  { key: 'recent', label: '최근 본 글', emoji: '🕐' },
];

function fmt(ts: number) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
}

export default function MyCustomizePage() {
  useDocumentMeta(
    '내가 직접 조절 — 차단·메모·보관함·최근 본 글',
    '보기 싫은 단어·닉네임 차단, 닉네임별 메모, 글 보관함, 최근 본 글 50개까지. 디시 검증된 4가지 사용자 컨트롤을 내 브라우저에 저장합니다.',
  );

  const [tab, setTab] = useState<Tab>('block');
  const blocks = useUserBlocks();
  const memos = useUserMemos();
  const bookmarks = useBookmarks();
  const recent = useRecentPosts();

  const [newWord, setNewWord] = useState('');
  const [newName, setNewName] = useState('');
  const [memoNick, setMemoNick] = useState('');
  const [memoText, setMemoText] = useState('');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-center text-2xl font-bold">내가 직접 조절</h1>
      <p className="mb-6 text-center text-sm text-neon-muted">
        보기 싫은 거 숨기고, 다시 보고 싶은 건 모아두자. 내 브라우저에만 저장됩니다.
      </p>

      <DailyPrompt />

      <div className="mb-6 grid grid-cols-4 gap-2">
        {TABS.map((t) => {
          const count =
            t.key === 'block'
              ? blocks.words.length + blocks.names.length
              : t.key === 'memo'
                ? memos.count
                : t.key === 'bookmark'
                  ? bookmarks.count
                  : recent.count;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center rounded-xl border px-2 py-2 text-xs font-medium transition ${
                active
                  ? 'border-neon-primary bg-neon-primary/10 text-neon-primary'
                  : 'border-neon-border bg-neon-surface text-neon-muted hover:text-neon-text'
              }`}
              style={{ minHeight: 56 }}
            >
              <span className="text-lg">{t.emoji}</span>
              <span>{t.label}</span>
              {count > 0 && <span className="mt-0.5 text-[10px]">{count}</span>}
            </button>
          );
        })}
      </div>

      {tab === 'block' && (
        <section className="space-y-6">
          <div>
            <h2 className="mb-2 font-bold">단어 차단</h2>
            <p className="mb-3 text-xs text-neon-muted">
              제목·본문에 이 단어가 들어가면 해당 글이 숨겨집니다.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="차단할 단어"
                className="min-w-0 flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    blocks.addWord(newWord);
                    setNewWord('');
                  }
                }}
              />
              <button
                onClick={() => {
                  blocks.addWord(newWord);
                  setNewWord('');
                }}
                className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white"
              >
                추가
              </button>
            </div>
            {blocks.words.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {blocks.words.map((w) => (
                  <li
                    key={w}
                    className="inline-flex items-center gap-1 rounded-full border border-neon-border bg-neon-surface px-3 py-1 text-xs"
                  >
                    <span>{w}</span>
                    <button
                      onClick={() => blocks.removeWord(w)}
                      className="text-neon-muted hover:text-neon-text"
                      aria-label={`${w} 차단 해제`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-2 font-bold">닉네임 차단</h2>
            <p className="mb-3 text-xs text-neon-muted">
              이 닉네임의 글·댓글이 숨겨집니다.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="차단할 닉네임"
                className="min-w-0 flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    blocks.addName(newName);
                    setNewName('');
                  }
                }}
              />
              <button
                onClick={() => {
                  blocks.addName(newName);
                  setNewName('');
                }}
                className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white"
              >
                추가
              </button>
            </div>
            {blocks.names.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {blocks.names.map((n) => (
                  <li
                    key={n}
                    className="inline-flex items-center gap-1 rounded-full border border-neon-border bg-neon-surface px-3 py-1 text-xs"
                  >
                    <span>{n}</span>
                    <button
                      onClick={() => blocks.removeName(n)}
                      className="text-neon-muted hover:text-neon-text"
                      aria-label={`${n} 차단 해제`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === 'memo' && (
        <section>
          <p className="mb-3 text-xs text-neon-muted">
            다른 사용자의 닉네임 옆에 나만 보는 메모를 달 수 있습니다.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={memoNick}
              onChange={(e) => setMemoNick(e.target.value)}
              placeholder="닉네임"
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="메모 (예: 후기 잘 쓰는 분)"
                className="min-w-0 flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  memos.setMemo(memoNick, memoText);
                  setMemoNick('');
                  setMemoText('');
                }}
                className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white"
              >
                저장
              </button>
            </div>
          </div>
          {memos.count > 0 && (
            <ul className="mt-4 space-y-2">
              {Object.entries(memos.memos).map(([n, m]) => (
                <li
                  key={n}
                  className="flex items-start justify-between rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-bold">{n}</p>
                    <p className="text-xs text-neon-muted">{m}</p>
                  </div>
                  <button
                    onClick={() => memos.removeMemo(n)}
                    className="text-xs text-neon-muted hover:text-neon-text"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'bookmark' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-neon-muted">
              저장한 글·업소 페이지. 최대 200개까지 보관됩니다.
            </p>
            {bookmarks.count > 0 && (
              <button
                onClick={bookmarks.clear}
                className="text-xs text-neon-muted hover:text-neon-text"
              >
                전체 삭제
              </button>
            )}
          </div>
          {bookmarks.count === 0 ? (
            <p className="rounded-lg border border-dashed border-neon-border bg-neon-surface px-3 py-8 text-center text-sm text-neon-muted">
              아직 보관한 글이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {bookmarks.items.map((b) => (
                <li
                  key={b.path}
                  className="flex items-center justify-between rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm"
                >
                  <Link to={b.path} className="min-w-0 flex-1 truncate hover:text-neon-primary">
                    {b.title}
                  </Link>
                  <span className="ml-2 shrink-0 text-[10px] text-neon-muted">{fmt(b.savedAt)}</span>
                  <button
                    onClick={() => bookmarks.remove(b.path)}
                    className="ml-2 shrink-0 text-xs text-neon-muted hover:text-neon-text"
                    aria-label="보관 해제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'recent' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-neon-muted">
              방금 본 페이지 최대 50개. 시간 순으로 정렬됩니다.
            </p>
            {recent.count > 0 && (
              <button
                onClick={recent.clear}
                className="text-xs text-neon-muted hover:text-neon-text"
              >
                기록 비우기
              </button>
            )}
          </div>
          {recent.count === 0 ? (
            <p className="rounded-lg border border-dashed border-neon-border bg-neon-surface px-3 py-8 text-center text-sm text-neon-muted">
              아직 기록이 없습니다. 페이지를 둘러본 뒤 돌아오세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.items.map((r) => (
                <li
                  key={r.path}
                  className="flex items-center justify-between rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm"
                >
                  <Link to={r.path} className="min-w-0 flex-1 truncate hover:text-neon-primary">
                    {r.title}
                  </Link>
                  <span className="ml-2 shrink-0 text-[10px] text-neon-muted">{fmt(r.viewedAt)}</span>
                  <button
                    onClick={() => recent.remove(r.path)}
                    className="ml-2 shrink-0 text-xs text-neon-muted hover:text-neon-text"
                    aria-label="기록 삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
