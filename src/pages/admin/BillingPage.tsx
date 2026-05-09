import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function BillingPage() {
  useDocumentMeta('구독·결제 내역 한눈에', '현재 요금제·결제 이력·변경·해지 한 페이지에서 처리. 단가는 카카오톡 besta12로 상세 문의 후 확정.');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">결제관리</h1>
        <p className="mt-1 text-sm text-neon-text-muted">
          구독 플랜 및 결제 내역을 관리합니다.
        </p>
      </div>

      <div className="rounded-xl border border-neon-border bg-neon-surface p-8 text-center">
        <p className="text-base font-semibold text-neon-text">결제 시스템 연결 준비 중</p>
        <p className="mt-2 text-sm text-neon-text-muted">
          요금제·결제 내역은 PG 연동이 완료되는 대로 이 화면에 노출됩니다.
        </p>
        <p className="mt-1 text-xs text-neon-text-muted">
          단가·플랜은 카카오톡 besta12로 직접 안내드립니다.
        </p>
      </div>
    </div>
  );
}
