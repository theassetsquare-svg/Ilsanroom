import Link from 'next/link';

const categoryLinks = [
  { href: '/clubs', label: '클럽' },
  { href: '/nights', label: '나이트' },
  { href: '/lounges', label: '라운지' },
  { href: '/rooms', label: '룸' },
  { href: '/yojeong', label: '요정' },
  { href: '/hoppa', label: '호빠' },
];

const communityLinks = [
  { href: '/community', label: '커뮤니티' },
  { href: '/events', label: '이벤트' },
  { href: '/reviews', label: '리뷰' },
  { href: '/tips', label: '나이트라이프 팁' },
];

const legalLinks = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/disclaimer', label: '면책조항' },
  { href: '/contact', label: '문의하기' },
];

export default function Footer() {
  return (
    <footer className="border-t border-neon-border bg-neon-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Site info */}
          <div>
            <Link href="/" className="neon-glow text-xl font-black tracking-wider text-neon-primary">
              NEON
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-neon-text-muted">
              대한민국 No.1 나이트라이프 가이드. 클럽, 나이트, 라운지, 룸, 요정, 호빠 정보를 한곳에서 확인하세요.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neon-text">카테고리</h3>
            <ul className="space-y-2">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neon-text-muted transition-colors hover:text-neon-primary-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neon-text">커뮤니티</h3>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neon-text-muted transition-colors hover:text-neon-primary-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neon-text">법적 고지</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neon-text-muted transition-colors hover:text-neon-primary-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-neon-border pt-6">
          <p className="text-center text-xs text-neon-text-muted">
            &copy; 2026 NEON. All rights reserved.
          </p>
          <p className="mt-2 text-center text-xs text-neon-text-muted/60">
            본 사이트의 정보는 참고용이며, 실제 영업 상황은 현장과 다를 수 있습니다. 방문 전 반드시 해당 업소에 직접 확인하시기 바랍니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
