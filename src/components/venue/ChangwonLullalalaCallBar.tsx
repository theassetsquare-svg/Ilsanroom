/* 창원룰루랄라나이트 전용 하단 고정 전화 바 (모바일 + PC 공통).
   - 모바일: MobileBottomNav(56px) 바로 위(bottom:56px+safe-area)에 위치 → 네비와 z-index/영역 충돌 0.
   - PC(md+): 하단 네비가 없으므로 화면 맨 아래(bottom:0)에 고정 — 스크롤해도 안 움직임.
   - 인쇄 시 숨김.
   - 표시 문구: "창원룰루랄라나이트 로또 010-7528-4936" + "27세 이상 출입 가능" 안내.
     번호는 굵게, 좁은 화면에서도 한 줄에 다 보이도록 clamp()로 폰트 자동 축소.
     바 전체가 tel: 탭투콜(+82 없이 국내번호 그대로).
   - data-fixed-phonebar: 이 바가 있는 페이지는 SecretModeToast(시크릿 팝업) 자동 숨김(전화 CTA 우선).
   - 창원룰루랄라 관련 페이지(창원 나이트 가이드 매거진 + 룰루랄라 상세)에만 렌더한다. */
export default function ChangwonLullalalaCallBar() {
  return (
    <div
      data-fixed-phonebar="true"
      className="fixed left-0 right-0 z-40 print:hidden bottom-[calc(56px_+_env(safe-area-inset-bottom))] md:bottom-0"
    >
      <a
        href="tel:01075284936"
        aria-label="창원룰루랄라나이트 로또에게 전화 걸기 010-7528-4936"
        className="flex flex-col items-center justify-center gap-0.5 px-4 py-2.5"
        style={{
          background: 'linear-gradient(to right, #14532D, #166534)',
          minHeight: 56,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.35)',
        }}
      >
        <span className="whitespace-nowrap" style={{ color: '#FFFFFF', fontSize: 'clamp(17px,4.4vw,18px)', fontWeight: 600 }}>
          창원룰루랄라나이트 로또{' '}
          <strong style={{ color: '#FFD700', fontWeight: 900, letterSpacing: '0.02em' }}>010 7528 4936</strong>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px,3vw,13px)', fontWeight: 500 }}>
          27세 이상 출입 가능 · 터치하면 바로 전화
        </span>
      </a>
    </div>
  );
}
