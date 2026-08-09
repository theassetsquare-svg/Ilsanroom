import { useState } from 'react';
import { Link } from '@/components/ui/SafeLink';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

/**
 * 인라인 가입 카드 (한국1위 파트4 S2a) — 팝업·강제벽 절대 아님, 흐름 속 한 장의 카드.
 * 비로그인일 때만 렌더. 카카오 1순위 + "익명 닉네임 자동·본명 X" 1줄 고정.
 */
const CONTEXT_COPY: Record<string, { title: string; sub: string }> = {
  roulette: { title: '뽑힌 곳, 다음에도 기억할래?', sub: '가입하면 룰렛 결과를 ⭐단골 목록에 담아둘 수 있어요.' },
  best: { title: '지금 본 순위, 다음 주엔 바뀔 수 있어요', sub: '가입하면 ⭐단골 목록·월 1표 순위 투표까지 바로 열려요.' },
  favorite: { title: '⭐ 담아두려면 3초면 돼요', sub: '가입하면 이 가게가 내 단골 목록에 저장되고 어디서든 다시 열려요.' },
  tapreview: { title: '탭 몇 번이면 후기 끝 — 타이핑 0', sub: '가입하면 방금 고른 걸 내 후기로 남기고, 창립멤버 번호도 바로 받아요.' },
};

export default function InlineJoinCard({ context }: { context: 'roulette' | 'best' | 'favorite' | 'tapreview' }) {
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);
  if (user) return null;
  const copy = CONTEXT_COPY[context] || CONTEXT_COPY.best;

  const kakaoStart = () => {
    const supabase = createClient();
    if (!supabase) return;
    setStarting(true);
    supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: 'https://nolcool.com/auth/callback' } });
  };

  return (
    <div className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: '#FEE500' }}>
      <p className="text-sm font-bold" style={{ color: '#111' }}>{copy.title}</p>
      <p className="mt-1 text-xs" style={{ color: '#777', lineHeight: '1.6' }}>{copy.sub}</p>
      <button
        onClick={kakaoStart}
        disabled={starting}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition active:scale-[0.98]"
        style={{ backgroundColor: '#FEE500', color: '#191919', minHeight: 48 }}
      >
        💬 {starting ? '카카오로 이동 중...' : '카카오로 3초 시작'}
      </button>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px]" style={{ color: '#999' }}>익명 닉네임 자동 · 본명 노출 X</p>
        <Link to="/login" className="text-[11px] font-medium" style={{ color: '#8B5CF6' }}>다른 방법으로 가입 →</Link>
      </div>
    </div>
  );
}
