interface StickyPhoneBarProps {
  phone: string | undefined;
  staffName: string | undefined;
  venueName: string;
}

export default function StickyPhoneBar({ phone, staffName, venueName }: StickyPhoneBarProps) {
  if (!phone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neon-primary/30 bg-gradient-to-r from-neon-primary-dark via-neon-primary to-neon-primary-dark backdrop-blur-md">
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs md:text-base font-bold text-white">
            {venueName}
          </p>
          {staffName && (
            <p className="truncate text-xs text-white/80">
              담당: {staffName}
            </p>
          )}
        </div>
        <a
          href={`tel:${phone.replace(/-/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-neon-green px-6 py-3 text-base md:text-lg font-bold text-white shadow-lg shadow-neon-green/30 transition hover:bg-neon-green/90 active:scale-95"
          style={{ minHeight: '44px', minWidth: '44px' }}
          aria-label={`${venueName} 전화걸기 ${phone}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="hidden sm:inline">{phone}</span>
          <span className="sm:hidden">전화</span>
        </a>
      </div>
    </div>
  );
}
