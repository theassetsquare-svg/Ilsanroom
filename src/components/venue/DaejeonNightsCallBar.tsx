/* 대전원나이트 예약문의 전용 하단 고정 전화 바 (모바일 전용).
   - MobileBottomNav(56px) 바로 위에 위치 → 기존 네비와 z-index/영역 충돌 0.
   - 데스크톱(md+) · 인쇄 시 숨김.
   - 표시 문구는 "대전원나이트 예약문의 010 4668 0764" 한 줄. 번호는 굵게, 좁은 화면에서도
     한 줄에 다 보이도록 clamp()로 폰트 자동 축소(줄바꿈·잘림 0). 바 전체가 tel: 탭투콜.
   - 대전 나이트 관련 3페이지(대전 나이트 지역허브 + 대전 나이트 가이드 매거진 + 대전원나이트 상세)에만 렌더한다. */
export default function DaejeonNightsCallBar() {
  return (
    <div
      className="fixed left-0 right-0 z-40 md:hidden print:hidden"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
    >
      <a
        href="tel:01046680764"
        aria-label="대전원나이트 예약문의 전화 걸기 010 4668 0764"
        className="flex items-center justify-center gap-2 px-4"
        style={{
          background: 'linear-gradient(to right, #15803D, #166534)',
          height: 56,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.35)',
        }}
      >
        <span className="whitespace-nowrap" style={{ color: '#FFFFFF', fontSize: 'clamp(13px,4.2vw,17px)', fontWeight: 600 }}>
          대전원나이트 예약문의{' '}
          <strong style={{ color: '#FFD700', fontWeight: 900, letterSpacing: '0.02em' }}>010 4668 0764</strong>
        </span>
      </a>
    </div>
  );
}
