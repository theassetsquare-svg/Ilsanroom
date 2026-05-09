// 가공 요금제 표(베이직 ₩99K / 프로 ₩299K / 프리미엄 ₩599K) 제거 — 신뢰 규칙.
// 단가는 카카오톡 besta12 상담 후 개별 안내. import 호환을 위해 null export 유지.
interface PricingTableProps {
  onSelect?: (tierName: string) => void;
  compact?: boolean;
}
export default function PricingTable(_: PricingTableProps) {
  return null;
}
