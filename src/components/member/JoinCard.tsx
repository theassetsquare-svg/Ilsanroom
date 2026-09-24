import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loginHref, rememberReturn } from '@/lib/auth-return';

/**
 * [놀쿨11-5] 인라인 가입 카드 — 옛 components/auth/InlineJoinCard(카카오 OAuth 직행 · 동의 칸 없음)를 갈음한다.
 *  팝업·강제벽 아님 · 비로그인일 때만 · 누르면 /login?redirect=<지금 쪽> → 동의(필수 3) → 카카오 → 이 쪽으로 돌아옴.
 *  우리 쪽 클릭 수: 이 카드 1 + 전체 동의 1 + 카카오 1 = 3.
 */
const CONTEXT_COPY: Record<string, { title: string; sub: string }> = {
  roulette: { title: '뽑힌 곳, 다음에도 기억할래?', sub: '가입하면 룰렛 결과를 ⭐단골 목록에 담아둘 수 있어요.' },
  best: { title: '지금 본 순위, 다음 주엔 바뀔 수 있어요', sub: '가입하면 ⭐단골 목록·주간 투표(1인 1표)까지 바로 열려요.' },
  favorite: { title: '⭐ 담아두려면 3초면 돼요', sub: '가입하면 이 가게가 내 단골 목록에 저장되고 어디서든 다시 열려요.' },
  tapreview: { title: '탭 몇 번이면 후기 끝 — 타이핑 0', sub: '가입하면 방금 고른 걸 내 후기로 남길 수 있어요.' },
};

export default function JoinCard({ context }: { context: 'roulette' | 'best' | 'favorite' | 'tapreview' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user) return null;
  const copy = CONTEXT_COPY[context] || CONTEXT_COPY.best;
  const go = () => { const here = window.location.pathname + window.location.search; rememberReturn(here); navigate(loginHref(here)); };

  return (
    <div className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: '#FEE500' }} data-nc-joincard={context}>
      <p className="text-sm font-bold" style={{ color: '#111' }}>{copy.title}</p>
      <p className="mt-1 text-xs" style={{ color: '#777', lineHeight: '1.6' }}>{copy.sub}</p>
      <button onClick={go} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition active:scale-[0.98]" style={{ backgroundColor: '#FEE500', color: '#191919', minHeight: 48 }}>
        💬 카카오·구글로 3초 가입
      </button>
      <p className="mt-2 text-[11px]" style={{ color: '#999' }}>닉네임은 「회원+번호」로 자동 · 본명 노출 없음 · 가입 뒤 이 쪽으로 돌아옵니다</p>
    </div>
  );
}
