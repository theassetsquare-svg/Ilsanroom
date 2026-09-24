import { useEffect, useState } from 'react';
import { Link } from '@/components/ui/SafeLink';
import { useAuth } from '@/hooks/useAuth';

/**
 * [놀쿨11-5] 가입 즉시 혜택 — 가입 직후 돌아온 쪽에서 한 번만 뜨는 안내(팝업·강제벽 아님 · 닫기 1번).
 *  전부 지금 바로 되는 진짜 기능 3가지만: ⭐ 찜 목록 · 🗳 주간 투표(1인 1표) · 🔔 알림 설정. 가짜 포인트·가짜 숫자 0.
 *  회원 전용은 편의뿐 — 정보는 비회원과 똑같이 본다.
 *  표시 조건: /auth/callback 이 새 계정(생성 10분 안)일 때 sessionStorage nc_just_joined=1 을 둔다.
 */
export default function WelcomeBenefits() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!user) return;
    try { if (sessionStorage.getItem('nc_just_joined') === '1') { setOpen(true); sessionStorage.removeItem('nc_just_joined'); } } catch { /* 없음 */ }
  }, [user]);
  if (!open || !user) return null;
  const notify = (user.user_metadata as any)?.notify || {};
  const items = [
    { icon: '⭐', title: '찜 목록', body: '가게 쪽 「이 가게 저장」을 누르면 어느 기기에서든 다시 열립니다.', to: '/my/favorites' },
    { icon: '🗳', title: '주간 투표', body: '이번 주 두 곳 중 한 곳에 1인 1표.', to: '/ranking' },
    { icon: '🔔', title: '알림 설정', body: notify.service || notify.ad ? '가입 때 고른 알림이 켜져 있습니다. 언제든 끌 수 있습니다.' : '지금은 꺼져 있습니다. 관심 지역을 골라 켤 수 있습니다.', to: '/my/favorites#notify' },
  ];
  return (
    <section role="region" aria-label="가입 완료 안내" className="mx-auto my-4 max-w-3xl rounded-2xl border border-purple-200 bg-white p-4 shadow-sm" data-nc-welcome>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold" style={{ color: '#111' }}>가입 완료 — 지금 바로 쓸 수 있는 것 3가지</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="닫기" className="shrink-0 rounded-full px-2 text-lg leading-none" style={{ color: '#9CA3AF' }}>×</button>
      </div>
      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
        {items.map((x) => (
          <li key={x.title}>
            <Link to={x.to} className="block rounded-xl border border-gray-100 p-3 hover:bg-gray-50" onClick={() => setOpen(false)}>
              <span className="text-[13px] font-bold" style={{ color: '#111' }}>{x.icon} {x.title}</span>
              <span className="mt-0.5 block text-[11px]" style={{ color: '#6B7280' }}>{x.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
