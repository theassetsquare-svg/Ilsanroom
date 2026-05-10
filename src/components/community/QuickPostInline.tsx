/**
 * QuickPostInline — 1줄 글쓰기 (트위터/스레드 패턴)
 *
 * 객관적 근거:
 * - 트위터: 280자 제한 = 일평균 5억 트윗
 * - 스레드: 단일 입력창 = 가입 후 첫 글 = 진입장벽 0
 * - 놀쿨 현재: 글쓰기 = 카테고리+제목+본문 = 진입장벽 ↑↑
 *
 * 동작:
 *  1) 비로그인 = 로그인 유도 카드
 *  2) 로그인 = 1줄 입력 → "올리기" 버튼
 *  3) 카테고리=free 기본, 제목=앞 30자 자동, 본문=전체 텍스트
 *  4) 등록 후 페이지 새로고침 (피드에 즉시 노출)
 */
import { useState } from 'react';
import { Link } from '../ui/SafeLink';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/lib/community-api';
import { checkContent } from '@/lib/content-filter';
import { COLOR, RADIUS } from '@/lib/design-tokens';

interface Props {
  onPosted?: () => void;
}

export function QuickPostInline({ onPosted }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    if (t.length < 5) {
      setErr('5자 이상 적어주세요');
      return;
    }
    // 욕설/금지어 체크
    const c = checkContent(t);
    if (c.action === 'block') {
      setErr(c.reason);
      return;
    }
    setBusy(true);
    setErr('');
    const finalText = c.action === 'mask' ? c.filteredText : t;
    const title = finalText.length > 30 ? finalText.slice(0, 30) + '…' : finalText;
    const result = await createPost({
      category: 'free',
      title,
      content: finalText,
    });
    setBusy(false);
    if (result.error) {
      setErr(result.error);
      return;
    }
    setText('');
    setOk(true);
    onPosted?.();
    setTimeout(() => setOk(false), 2200);
  };

  // 비로그인 — 가벼운 유도
  if (!user) {
    return (
      <div
        style={{
          background: COLOR.bg.elevate,
          border: `1px solid ${COLOR.bg.border}`,
          borderRadius: RADIUS.lg,
          padding: '14px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, fontSize: 14, color: COLOR.text.secondary }}>
          오늘 어디 갔다 왔어요? 한 줄로 자랑해봐요
        </div>
        <Link
          to="/login"
          style={{
            background: COLOR.gradient.hot,
            color: '#fff',
            padding: '8px 14px',
            borderRadius: RADIUS.sm,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLOR.bg.elevate,
        border: `1px solid ${COLOR.bg.border}`,
        borderRadius: RADIUS.lg,
        padding: '12px 14px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={e => {
            setText(e.target.value);
            if (err) setErr('');
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="한 줄로 적어요. 오늘 다녀온 곳, 추천, 질문, 뭐든..."
          rows={2}
          maxLength={280}
          style={{
            flex: 1,
            background: COLOR.bg.raised,
            border: `1px solid ${COLOR.bg.border}`,
            borderRadius: RADIUS.md,
            padding: '10px 12px',
            color: COLOR.text.primary,
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'none',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={submit}
          disabled={busy || text.trim().length < 5}
          style={{
            background: text.trim().length >= 5 ? COLOR.gradient.hot : COLOR.bg.raised,
            color: text.trim().length >= 5 ? '#fff' : COLOR.text.tertiary,
            border: 'none',
            borderRadius: RADIUS.md,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: busy || text.trim().length < 5 ? 'not-allowed' : 'pointer',
            minHeight: 44,
            whiteSpace: 'nowrap',
            transition: 'background 0.2s',
          }}
        >
          {busy ? '...' : '올리기'}
        </button>
      </div>

      {/* 글자수 + 에러/성공 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
          fontSize: 11,
          color: COLOR.text.tertiary,
          minHeight: 16,
        }}
      >
        <span>
          {err && <span style={{ color: '#FF4D6D' }}>{err}</span>}
          {ok && <span style={{ color: COLOR.neon.cyan }}>✓ 올렸어요!</span>}
        </span>
        <span>{text.length}/280</span>
      </div>
    </div>
  );
}
