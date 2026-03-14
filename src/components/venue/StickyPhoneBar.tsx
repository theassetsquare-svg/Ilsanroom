interface StickyPhoneBarProps {
  phone: string | undefined;
  staffName: string | undefined;
  venueName: string;
}

export default function StickyPhoneBar({ phone, staffName, venueName }: StickyPhoneBarProps) {
  if (!phone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-300">
            {venueName}
            {staffName && (
              <span className="ml-2 text-amber-400">담당: {staffName}</span>
            )}
          </p>
        </div>
        <a
          href={`tel:${phone.replace(/-/g, '')}`}
          className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-white transition hover:bg-emerald-500 active:scale-95 sm:text-lg"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <span className="text-lg">📞</span>
          <span>{phone}</span>
        </a>
      </div>
    </div>
  );
}
