import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function PricingPage() {
  useDocumentMeta('업주 요금제 안내', '지역과 업소 특성에 맞는 맞춤 요금제를 안내드립니다. 카카오톡 besta12로 문의해주세요.');

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-2" style={{ color: '#111' }}>업주 요금제 안내</h1>
      <p className="text-center text-sm mb-10" style={{ color: '#555' }}>
        놀쿨은 지역, 업종, 규모에 따라 최적화된 요금제를 제안드립니다.
      </p>

      {/* 안내 카드 */}
      <div className="rounded-2xl border p-8 mb-8 text-center" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <p className="text-5xl mb-4">📋</p>
        <h2 className="text-xl font-bold mb-3" style={{ color: '#111' }}>왜 맞춤 요금제인가요?</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: '#555', lineHeight: '1.8' }}>
          강남 클럽과 지방 나이트는 시장 규모가 다릅니다.<br />
          룸과 요정은 고객 단가가 다릅니다.<br />
          신규 오픈과 10년 된 곳은 필요한 서비스가 다릅니다.<br /><br />
          그래서 놀쿨은 <strong>일률적인 요금표 대신, 업소 상황에 딱 맞는 요금제</strong>를 직접 상담 후 안내드립니다.<br />
          불필요한 비용 없이, 필요한 서비스만 선택하실 수 있습니다.
        </p>
      </div>

      {/* 포함 서비스 */}
      <div className="rounded-2xl border p-6 mb-8" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
        <h3 className="text-base font-bold mb-4" style={{ color: '#111' }}>놀쿨 입점 시 제공 서비스</h3>
        <div className="space-y-3 text-sm" style={{ color: '#333' }}>
          <div className="flex items-center gap-3">
            <span style={{ color: '#22C55E' }}>✓</span>
            <span>전국 나이트라이프 플랫폼 노출 (월 10만+ 방문자)</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: '#22C55E' }}>✓</span>
            <span>업소 전용 상세 페이지 (사진, 설명, 연락처, 지도)</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: '#22C55E' }}>✓</span>
            <span>구글·네이버·AI 검색 최적화 (SEO)</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: '#22C55E' }}>✓</span>
            <span>실시간 인기 랭킹 노출</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: '#22C55E' }}>✓</span>
            <span>고객 리뷰 관리</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: '#22C55E' }}>✓</span>
            <span>담당 실장 이름·연락처 노출</span>
          </div>
        </div>
      </div>

      {/* 입점 업소 현황 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>116+</p>
          <p className="text-xs" style={{ color: '#888' }}>등록 업소</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>6개</p>
          <p className="text-xs" style={{ color: '#888' }}>업종 카테고리</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>전국</p>
          <p className="text-xs" style={{ color: '#888' }}>서비스 지역</p>
        </div>
      </div>

      {/* 문의 CTA */}
      <div className="rounded-2xl p-8 text-center mb-6" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' }}>
        <p className="text-lg font-bold text-white mb-1">요금제·입점 문의</p>
        <p className="text-3xl font-black text-white mb-3">카카오톡 besta12</p>
        <p className="text-sm text-white/80 mb-4">
          업소 상황에 맞는 최적 요금제를 안내드리겠습니다.<br />
          부담 없이 문의해주세요.
        </p>
        <p className="text-xs text-white/60">평일 10:00~18:00 · 주말/공휴일 가능</p>
      </div>

      <p className="text-xs text-center" style={{ color: '#999' }}>
        카드 결제 서비스는 준비 중입니다. 현재는 상담 후 개별 안내드립니다.
      </p>
    </div>
  );
}
