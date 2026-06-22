interface StickyPhoneBarProps {
  phone: string | undefined;
  staffName: string | undefined;
  venueName: string;
}

const ALLOWED_PHONES = [
  '010-3695-4929', // 신실장 (일산룸, 일산명월관요정)
  '010-7942-9076', // 따봉 (부산연산동물나이트, 부산물나이트)
  '010-3987-6885', // 박찬호 (성남샴푸나이트)
  '010-9354-1323', // 강호동 (수원찬스돔나이트)
  '010-4241-3748', // 태양 (신림그랑프리나이트)
  '010-5655-4866', // 펩시맨 (청담H2O나이트)
  '010-8255-3509', // 막내 (파주야당스카이돔나이트)
  '010-8677-1258', // 막내 (대전원나이트)
  '010-5653-0069', // 춘자 (울산챔피언나이트)
  '010-6773-6222', // 수빈 (해운대호빠 깐따삐야)
  '010-3854-6887', // 짱구 (창원룰루랄라나이트)
];

/** 하단 고정 전화바를 사용하지 않는 업소 (본문에 전용 전화 섹션/바가 이미 있어 중복 방지) */
const HIDE_STICKY_VENUES = new Set([
  '답십리돈텔마마나이트',
  // 창원룰루랄라나이트는 전용 헤더 전화바(ChangwonLululalalaFixedBar)가 있어 제네릭 바 중복만 차단.
  //   전화 자체는 노출(NAP). 해운대호빠는 전용 바가 없어 제네릭 바로 전화 재노출.
  '창원룰루랄라나이트',
]);

export default function StickyPhoneBar({ phone, staffName, venueName }: StickyPhoneBarProps) {
  if (HIDE_STICKY_VENUES.has(venueName)) return null;
  if (phone && ALLOWED_PHONES.includes(phone)) {
    return (
      <div data-sticky-phone="true" className="fixed bottom-[72px] right-4 z-[80] md:bottom-6 md:right-6">
        <a
          href={`tel:${phone.replace(/-/g, '')}`}
          className="flex items-center gap-2 rounded-full bg-[#15803D] px-5 py-3.5 min-h-[44px] text-sm font-bold text-white shadow-2xl ring-2 ring-white/80 transition hover:bg-[#166534] active:scale-95"
          aria-label={`${venueName} 전화걸기 ${phone}`}
        >
          <span>📞</span>
          <span>{staffName ? `${staffName} ${phone}` : phone}</span>
        </a>
      </div>
    );
  }

  // 전화번호 없는 업소: 아무것도 표시하지 않음
  return null;
}
