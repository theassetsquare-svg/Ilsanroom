import { useLocation } from 'react-router-dom';
import ROSTER from '@/data/advertisers.nolcool.json';
import IlsanMyeongwolgwanCallBar from '@/components/venue/IlsanMyeongwolgwanCallBar';
import { pageKey } from '@/lib/venue-file-ver';

/* [놀쿨44-1 · 대표님 2026-10-11 18:09] 놀쿨 명단(src/data/advertisers.nolcool.json)에서 fixedBar 가 켜진 광고주(신실장 · 일산명월관요정)의
   쪽에만 화면 아래 고정 전화바(번호만)를 띄운다. 자리는 틀(MainLayout) 한 곳 — 쪽마다 따로 넣지 않아 명단에 쪽을 더하면 바가 따라온다.
   명단에 없는 쪽에서는 아무것도 그리지 않는다(다른 쪽 화면 변화 0). 따봉·쌍코피 쪽은 지금처럼 StickyPhoneBar 가 맡는다(fixedBar 없음). */
type RosterAd = { phone: string; pages: string[]; fixedBar?: boolean };
const BAR_BY_PAGE = new Map<string, string>();
for (const a of (ROSTER as { advertisers: RosterAd[] }).advertisers) {
  if (a.fixedBar) for (const p of a.pages) BAR_BY_PAGE.set(pageKey(p), a.phone);
}

export default function PageAdBar() {
  const { pathname } = useLocation();
  const phone = BAR_BY_PAGE.get(pageKey(pathname));
  if (!phone) return null;
  return (
    <>
      {/* 하단 고정 바에 쪽 맨 끝(푸터 마지막 줄)이 가려지지 않도록 여백 (모바일+PC 공통 — PC도 전화바 표시) */}
      <div aria-hidden style={{ height: 'calc(60px + env(safe-area-inset-bottom))' }} />
      <IlsanMyeongwolgwanCallBar phone={phone} />
    </>
  );
}
