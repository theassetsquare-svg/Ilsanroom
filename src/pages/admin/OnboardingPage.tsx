import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Link } from '../../components/ui/SafeLink';

export default function OnboardingPage() {
  useDocumentMeta('입점 신청 — 사장님 전용', '사업자등록증·매장 사진 3장이면 입점 신청 가능. 카카오톡 besta12로 상세 문의 가능. 노출 위치·기간은 협의 후 확정.');

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-2" style={{ color: '#111' }}>업소 입점 안내</h1>
      <p className="text-center text-sm mb-8" style={{ color: '#555' }}>놀쿨에 업소를 등록하고 싶으시다면 아래로 문의해주세요.</p>

      {/* 카톡 문의 */}
      <div className="rounded-2xl border p-8 text-center mb-6" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <p className="text-5xl mb-4">💬</p>
        <p className="text-lg font-bold mb-1" style={{ color: '#111' }}>광고/입점 문의</p>
        <p className="text-3xl font-black mb-2" style={{ color: '#8B5CF6' }}>카카오톡 besta12</p>
        <p className="text-sm" style={{ color: '#555' }}>카카오톡에서 besta12를 검색해서 문의해주세요</p>
      </div>

      {/* 안내 */}
      <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
        <h2 className="text-base font-bold mb-3" style={{ color: '#111' }}>입점 절차</h2>
        <div className="space-y-3 text-sm" style={{ color: '#555' }}>
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>1</span>
            <span>카카오톡 besta12로 문의</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>2</span>
            <span>업소 정보 전달 (상호명, 주소, 연락처, 사진)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>3</span>
            <span>검토 후 등록 완료 안내</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-center mb-6" style={{ color: '#999' }}>카드 결제 서비스는 준비 중입니다.</p>

      <Link to="/" className="block w-full rounded-xl py-3 text-center text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
