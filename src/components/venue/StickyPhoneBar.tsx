interface StickyPhoneBarProps {
  phone: string | undefined;
  staffName: string | undefined;
  venueName: string;
}

const ALLOWED_PHONES = [
  '010-7942-9076', // 따봉
  '010-3987-6885', // 박찬호
  '010-9354-1323', // 강호동
  '010-4241-3748', // 태양
  '010-5655-4866', // 펩시맨
  '010-8255-3509', // 막내
  '010-5653-0069', // 춘자
];

export default function StickyPhoneBar({ phone, staffName, venueName }: StickyPhoneBarProps) {
  if (phone && ALLOWED_PHONES.includes(phone)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 md:pb-4">
        <a
          href={`tel:${phone.replace(/-/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#16A34A] active:scale-95"
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
