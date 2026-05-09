// "프로 플랜 3배 노출" 가공 배너 제거 — 단가·노출 보장은 출처 없는 약속이라 비활성화.
interface UpgradeBannerProps {
  onUpgrade?: () => void;
  onLearnMore?: () => void;
}
export default function UpgradeBanner(_: UpgradeBannerProps) {
  return null;
}
