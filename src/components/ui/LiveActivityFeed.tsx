/**
 * 실시간 활동 피드 — 닉네임/업소/액션을 무작위로 조합한 가짜 스트림이라
 *  근거 없는 활동 정보로 판단해 비활성화. 10개 임포트 호환을 위해 동일한 default export 시그니처 유지.
 */
interface Props {
  maxItems?: number;
  interval?: number;
  compact?: boolean;
  className?: string;
  category?: string;
}

export default function LiveActivityFeed(_: Props) {
  return null;
}
