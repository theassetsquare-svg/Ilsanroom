import { venues } from '@/data/venues';

interface StickyPhoneBarProps {
  phone: string | undefined;
  staffName: string | undefined;
  venueName: string;
}

/* ★ 2026-08-25 — 허용 번호를 손으로 적지 않는다.
 *
 * 예전에는 여기에 번호를 하나씩 타자로 적어 두었다. 그래서
 * **데이터에 광고주를 제대로 등록해도 이 명단에 없으면 전화바가 안 떴다.**
 * 부산아시아드나이트(새우깡 010-3614-1056)가 실제로 그랬고,
 * 대구바밤바나이트(둘리)도 같은 이유로 안 뜨고 있었다.
 * 등록은 됐는데 화면에 없으니 눈치채기가 아주 어렵다.
 *
 * 이제 src/data/venues.ts 의 staffPhone 을 유일한 기준으로 삼는다.
 * 광고주를 데이터에 등록하면 전화바가 자동으로 따라온다.
 *
 * 안전장치는 그대로 둔다 — 데이터에 실제로 등록된 번호만 통과하므로
 * 오타나 승인 안 된 번호가 전화 버튼으로 나갈 일은 없다. */
const REGISTERED_PHONES = new Set(
  venues.map((v) => v.staffPhone).filter((p): p is string => Boolean(p)),
);

/** 하단 고정 전화바를 사용하지 않는 업소 (본문에 전용 전화 섹션/바가 이미 있어 중복 방지) */
const HIDE_STICKY_VENUES = new Set([
  '답십리돈텔마마나이트',
  '일산명월관요정', // 전용 하단 고정 전화 바(IlsanMyeongwolgwanCallBar) 사용 → 플로팅 필 중복 방지
  '대전세븐나이트', // 전용 하단 고정 전화 바(DaejeonSevenFixedBar) 사용 → 중복 방지
  '창원룰루랄라나이트', // 전용 하단 고정 전화 바(ChangwonLullalalaCallBar) 사용 → 중복 방지
  '답십리미라클나이트', // 전용 하단 고정 전화 바(DapsimnriMiracleFixedBar) 사용 → 중복 방지
]);

export default function StickyPhoneBar({ phone, staffName, venueName }: StickyPhoneBarProps) {
  if (HIDE_STICKY_VENUES.has(venueName)) return null;
  if (phone && REGISTERED_PHONES.has(phone)) {
    return (
      <div data-sticky-phone="true" className="fixed bottom-[72px] right-4 z-[80] md:bottom-6 md:right-6">
        <a
          href={`tel:${phone.replace(/-/g, '')}`}
          className="flex items-center gap-2 rounded-full bg-[#15803D] px-5 py-3.5 min-h-[44px] max-w-[calc(100vw-2rem)] text-sm font-bold leading-tight text-white shadow-2xl ring-2 ring-white/80 transition hover:bg-[#166534] active:scale-95"
          aria-label={`${venueName} 전화걸기 ${phone}`}
        >
          <span className="shrink-0">📞</span>
          <span>{[venueName, staffName, phone].filter(Boolean).join(' ')}</span>
        </a>
      </div>
    );
  }

  // 전화번호 없는 업소: 아무것도 표시하지 않음
  return null;
}
