
const KAKAO_CHAT_URL = 'https://pf.kakao.com/besta12/chat';

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.113 4.508 6.459-.2.744-.723 2.694-.828 3.112-.13.52.19.513.4.373.164-.109 2.612-1.78 3.67-2.502.725.104 1.476.158 2.25.158 5.523 0 10-3.463 10-7.6S17.523 3 12 3Z" />
    </svg>
  );
}

export default function PricingCTA({ planId, label, highlighted }: { planId: string; label: string; highlighted: boolean }) {
  const isFree = planId === 'free';

  if (isFree) {
    return (
      <div className="mt-auto">
        <a
          href="/onboarding"
          className="block rounded-xl px-6 py-3 text-center text-sm font-semibold border border-neutral-600 text-neon-text hover:bg-neon-surface-2 transition-colors"
          style={{ minHeight: 48 }}
        >
          {label}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-auto space-y-2">
      <a
        href="/onboarding"
        className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
      >
        시작하기
      </a>
    </div>
  );
}
