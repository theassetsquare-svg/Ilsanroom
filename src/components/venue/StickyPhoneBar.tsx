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
  '010-5653-0069', // 춘자 (울산챔피언나이트)
];

export default function StickyPhoneBar({ phone, staffName, venueName }: StickyPhoneBarProps) {
  if (phone && ALLOWED_PHONES.includes(phone)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 md:pb-4">
        <a
          href={`tel:${phone.replace(/-/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#166534] active:scale-95"
          style={{ maxWidth: '400px', minHeight: '48px' }}
          aria-label={`${venueName} 전화걸기 ${phone}`}
        >
          <span>📞</span>
          <span>{staffName ? `${staffName} ${phone}` : phone}</span>
        </a>
      </div>
    );
  }

  // 허용 번호가 아니거나 전화번호 없는 업소: 광고문의 카톡 besta12
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 md:pb-4">
      <div
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-6 py-3.5 text-base font-bold text-[#3C1E1E] shadow-lg"
        style={{ maxWidth: '400px', minHeight: '48px' }}
      >
        <span>광고문의 카톡</span>
        <span className="rounded-lg bg-white/40 px-3 py-0.5">besta12</span>
      </div>
    </div>
  );
}
