import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

/**
 * 창립멤버 보상 (파트4.5) — 첫 기여(탭 후기·글·한 줄) 완료 직후 1회만 축하 오버레이.
 * claim_founding_member RPC 가 멱등으로 영구 번호를 발급/반환한다(실번호만, 창작 0).
 * "사람 답글 흉내"가 아니라 시스템 감사 화면 — 실제 답글은 운영 알림 큐(사람 몫) 유지.
 * localStorage 로 최초 1회만 노출 → 두 번째 기여부터는 조용히 넘어간다.
 */
const SHOWN_KEY = 'nolcool_founding_shown';

export default function FoundingMemberReward({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [memberNo, setMemberNo] = useState<number | null>(null);

  useEffect(() => {
    if (!show || !user) return;
    if (typeof window !== 'undefined' && localStorage.getItem(SHOWN_KEY)) { onClose(); return; }
    const supabase = createClient();
    if (!supabase) { onClose(); return; }
    (supabase.rpc('claim_founding_member') as any).then(
      ({ data }: { data: number | null }) => {
        if (typeof data === 'number' && data > 0) {
          setMemberNo(data);
          try { localStorage.setItem(SHOWN_KEY, String(data)); } catch { /* ignore */ }
        } else {
          onClose();
        }
      },
      () => onClose(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, user]);

  if (!show || memberNo == null) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(17,17,17,0.55)' }} onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl">🎉</div>
        <p className="mt-2 text-sm font-bold" style={{ color: '#8B5CF6' }}>첫 기여 감사합니다</p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-white">
          <span className="text-base">🛡️</span>
          <span className="text-lg font-black">창립멤버 {memberNo.toLocaleString()}번</span>
        </div>
        <p className="mt-4 text-sm" style={{ color: '#555', lineHeight: '1.7' }}>
          영구 번호로 남습니다. 좋은 글은 홈에 닉네임과 함께 노출돼요.
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.98]"
          style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
