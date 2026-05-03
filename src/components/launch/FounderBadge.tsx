import { useFoundingMember } from '@/hooks/useFoundingMember';
import { useAuth } from '@/hooks/useAuth';

/* 창립멤버 ⭐ 뱃지 — 1~100번 영구 노출
   프로필 페이지/댓글/글에 사용. 명예욕 트리거. */

export default function FounderBadge({ inline = false }: { inline?: boolean }) {
  const { user } = useAuth();
  const { myNumber, isFounder } = useFoundingMember(user?.id);

  if (!isFounder || !myNumber) return null;

  if (inline) {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white"
        title={`창립멤버 #${myNumber}`}
      >
        <span>⭐</span>
        <span>#{myNumber}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 px-3 py-1 shadow-sm">
      <span className="text-sm">⭐</span>
      <span className="text-[11px] font-black text-white tracking-wider">창립멤버 #{myNumber}</span>
    </div>
  );
}
