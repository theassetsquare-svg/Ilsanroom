/* 놀쿨 운영팀 공식 명찰 (2026-08-09 파트2.5)
   운영자 글·댓글이 일반 회원 글로 오인되지 않도록 작성자 옆에 명시 표시한다.
   공식 운영팀 계정 닉네임(고정 상수)으로 작성한 경우에만 명찰이 붙는다 — 가짜/사칭 방지.
   ※ 회원가입 닉네임은 이 값과 충돌하지 않도록 예약어로 취급(가입 유효성에서 차단 권장). */

export const OFFICIAL_TEAM_NICKNAMES = ['놀쿨운영팀', '놀쿨 운영팀', '운영팀'];

export function isOfficialTeam(nickname?: string | null): boolean {
  return !!nickname && OFFICIAL_TEAM_NICKNAMES.includes(nickname.trim());
}

export default function AuthorBadge({ nickname }: { nickname?: string | null }) {
  if (!isOfficialTeam(nickname)) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-1.5 py-0.5 text-[9px] font-black text-white align-middle"
      title="놀쿨 운영팀 공식 계정"
    >
      🛡️ 운영팀
    </span>
  );
}
