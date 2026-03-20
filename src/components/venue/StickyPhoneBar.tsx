interface StickyPhoneBarProps {
  phone: string | undefined;
  staffName: string | undefined;
  venueName: string;
}

export default function StickyPhoneBar({ phone, staffName, venueName }: StickyPhoneBarProps) {
  if (phone) {
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

  // 전화번호 없는 업소: 카톡 문의
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-3 md:pb-4">
      <div
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-primary px-6 py-3.5 text-base font-bold text-white shadow-lg"
        style={{ maxWidth: '400px', minHeight: '48px' }}
      >
        <span>광고문의 카톡</span>
        <span className="rounded-lg bg-white/20 px-3 py-0.5">besta12</span>
      </div>
    </div>
  );
}
