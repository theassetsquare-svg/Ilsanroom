/* 일산명월관요정 광고주(신실장) 하단 고정 전화 바 (모바일 + PC 공통) — [놀쿨44-1 · 대표님 2026-10-11 18:09]
   - 놀쿨 명단(src/data/advertisers.nolcool.json)의 신실장 쪽 = 제목에 「일산명월관」·「일산요정」이 든 쪽에만 뜬다. 띄우는 자리는 PageAdBar 한 곳(번호도 명단에서 받는다).
   - 표시 글자는 전화번호만(가게이름·닉네임·다른 글자 0 — 대표님 2026-10-08 「고정바 전화번호 넣을 때는 전화번호만」). 좁은 화면에서도
     한 줄에 다 보이도록 clamp()로 폰트 자동 축소(줄바꿈·잘림 0). 바 전체가 tel: 탭투콜.
   - 모바일: MobileBottomNav(56px) 바로 위(bottom:56px)에 위치 → 네비와 z-index/영역 충돌 0.
   - PC(md+): 하단 네비가 없으므로 화면 맨 아래(bottom:0)에 고정 — 스크롤해도 안 움직임.
   - 인쇄 시 숨김.
   - data-fixed-phonebar: 이 바가 있는 페이지는 SecretModeToast(시크릿 팝업) 자동 숨김(전화 CTA 우선). */
export default function IlsanMyeongwolgwanCallBar({ phone }: { phone: string }) {
  return (
    <div
      data-fixed-phonebar="true"
      className="fixed left-0 right-0 z-40 print:hidden bottom-[calc(56px_+_env(safe-area-inset-bottom))] md:bottom-0"
    >
      <a
        href={`tel:${phone.replace(/\D/g, '')}`}
        aria-label={`전화 걸기 ${phone}`}
        className="flex items-center justify-center gap-2 px-4"
        style={{
          background: 'linear-gradient(to right, #14532D, #166534)',
          height: 56,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.35)',
        }}
      >
        <strong className="whitespace-nowrap" style={{ color: '#FFD700', fontSize: 'clamp(15px,5vw,20px)', fontWeight: 900, letterSpacing: '0.02em' }}>
          {phone}
        </strong>
      </a>
    </div>
  );
}
