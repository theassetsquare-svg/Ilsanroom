import Link from 'next/link';

const categoryLinks = [
  { href: '/clubs', label: '🎵 EDM' },
  { href: '/nights', label: '🌙 댄스홀' },
  { href: '/lounges', label: '🍸 바' },
  { href: '/rooms', label: '🚪 프라이빗' },
  { href: '/yojeong', label: '🏮 한정식' },
  { href: '/hoppa', label: '🥂 호스트' },
];

const communityLinks = [
  { href: '/community', label: '커뮤니티' },
  { href: '/events', label: '이벤트' },
  { href: '/ranking', label: '랭킹' },
  { href: '/magazine', label: '매거진' },
  { href: '/quiz', label: '퀴즈' },
];

const legalLinks = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/disclaimer', label: '면책조항' },
  { href: '/venue-terms', label: '업소등록약관' },
  { href: '/help', label: '고객센터' },
];

/* ★ SEO 내부링크: 전국 지역별 */
const regionalLinks = {
  '서울': [
    { href: '/clubs/gangnam', label: '강남' },
    { href: '/clubs/hongdae', label: '홍대' },
    { href: '/clubs/itaewon', label: '이태원' },
    { href: '/clubs/apgujeong', label: '압구정' },
    { href: '/lounges/sinsa', label: '신사' },
    { href: '/clubs/geondae', label: '건대' },
  ],
  '경기': [
    { href: '/rooms/ilsan', label: '일산' },
    { href: '/nights/suwon', label: '수원' },
    { href: '/clubs/incheon', label: '인천' },
  ],
  '부산·경남': [
    { href: '/clubs/busan', label: '서면' },
    { href: '/nights/haeundae', label: '해운대' },
  ],
  '기타': [
    { href: '/clubs/daegu', label: '대구' },
    { href: '/clubs/gwangju', label: '광주' },
    { href: '/clubs/daejeon', label: '대전' },
    { href: '/clubs/jeju', label: '제주' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-neon-border bg-neon-surface pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Site info */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="neon-glow text-xl font-black tracking-wider text-neon-primary">
              오늘밤어디
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-neon-text-muted">
              전국 야간 업소 정보를 한곳에서 확인하세요.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neon-text">카테고리</h3>
            <ul className="space-y-2">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-text-muted transition-colors hover:text-neon-primary-light">
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
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-text-muted transition-colors hover:text-neon-primary-light">
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
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-text-muted transition-colors hover:text-neon-primary-light">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ★ Regional SEO Links ★ */}
        <div className="mt-8 border-t border-neon-border pt-6">
          <h3 className="mb-4 text-sm font-semibold text-neon-text">전국 지역별 업소</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(regionalLinks).map(([region, links]) => (
              <div key={region}>
                <h4 className="mb-2 text-xs font-semibold text-neon-accent">{region}</h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neon-text-muted transition-colors hover:text-neon-primary-light"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SaaS / Business links */}
        <div className="mt-6 border-t border-neon-border pt-6">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-neon-text-muted">
            <Link href="/pricing" target="_blank" rel="noopener noreferrer" className="hover:text-neon-primary-light transition-colors">업주 요금제</Link>
            <Link href="/for-business" target="_blank" rel="noopener noreferrer" className="hover:text-neon-primary-light transition-colors">업주 입점</Link>
            <Link href="/demo" target="_blank" rel="noopener noreferrer" className="hover:text-neon-primary-light transition-colors">데모</Link>
            <Link href="/referral" target="_blank" rel="noopener noreferrer" className="hover:text-neon-primary-light transition-colors">추천 프로그램</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-neon-border pt-6">
          <p className="text-center text-xs text-neon-text-muted">
            &copy; 2026 오늘밤어디. All rights reserved.
          </p>
          <p className="mt-2 text-center text-xs text-neon-text-muted/60">
            본 사이트의 정보는 참고용이며, 실제 영업 상황은 현장과 다를 수 있습니다. 방문 전 반드시 해당 업소에 직접 확인하시기 바랍니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
