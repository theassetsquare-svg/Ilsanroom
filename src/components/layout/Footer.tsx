import { Link } from 'react-router-dom';

const categoryLinks = [
  { href: '/clubs', label: '클럽' },
  { href: '/nights', label: '나이트' },
  { href: '/hoppa', label: '호빠' },
  { href: '/lounges', label: '라운지' },
  { href: '/rooms', label: '룸' },
  { href: '/yojeong', label: '요정' },
];

const communityLinks = [
  { href: '/community', label: '커뮤니티' },
  { href: '/community/jogak', label: '조각모집' },
  { href: '/ranking', label: '랭킹' },
  { href: '/gallery', label: '클립' },
  { href: '/vs', label: 'VS 투표' },
];

const infoLinks = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/help', label: '고객센터' },
  { href: '/pricing', label: '광고/요금제' },
];

/* ★ SEO 내부링크: 전국 지역별 */
const regionalLinks = {
  '서울': [
    { href: '/clubs/gangnam', label: '강남' },
    { href: '/clubs/hongdae', label: '홍대' },
    { href: '/clubs/itaewon', label: '이태원' },
    { href: '/clubs/apgujeong', label: '압구정' },
    { href: '/clubs/cheongdam', label: '청담' },
    { href: '/clubs/sinlim', label: '신림' },
    { href: '/clubs/nowon', label: '노원' },
    { href: '/clubs/yongsan', label: '용산' },
  ],
  '경기·인천': [
    { href: '/rooms/ilsan', label: '일산' },
    { href: '/nights/suwon', label: '수원' },
    { href: '/clubs/incheon', label: '인천' },
    { href: '/nights/bucheon', label: '부천' },
    { href: '/nights/ansan', label: '안산' },
    { href: '/nights/seongnam', label: '성남' },
    { href: '/nights/gimpo', label: '김포' },
    { href: '/nights/paju', label: '파주' },
  ],
  '부산·경남': [
    { href: '/nights/busan', label: '부산' },
    { href: '/rooms/haeundae', label: '해운대' },
    { href: '/nights/ulsan', label: '울산' },
  ],
  '충청·전라·제주': [
    { href: '/nights/daejeon', label: '대전' },
    { href: '/nights/cheonan', label: '천안' },
    { href: '/nights/cheongju', label: '청주' },
    { href: '/nights/daegu', label: '대구' },
    { href: '/nights/gwangju', label: '광주' },
    { href: '/nights/jeju', label: '제주' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-neon-border bg-neon-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        {/* 광고문의 */}
        <div className="mb-8 rounded-2xl border-2 border-neon-primary/30 bg-gradient-to-r from-violet-50 to-white px-6 py-5 text-center">
          <p className="text-lg font-bold" style={{ color: '#111' }}>
            광고문의 카톡{' '}
            <span className="inline-block rounded-xl bg-neon-primary px-4 py-1 text-white">besta12</span>
          </p>
          <Link to="/pricing" className="mt-3 inline-block rounded-xl px-6 py-2.5 text-sm font-bold text-white transition active:scale-[0.98]" style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>
            업주 요금제 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {/* 카테고리 */}
          <div>
            <h3 className="mb-3 text-sm font-bold" style={{ color: '#111' }}>업소 카테고리</h3>
            <ul className="space-y-2">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm transition-colors hover:text-[#8B5CF6]" style={{ color: '#555' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 커뮤니티 */}
          <div>
            <h3 className="mb-3 text-sm font-bold" style={{ color: '#111' }}>즐길거리</h3>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm transition-colors hover:text-[#8B5CF6]" style={{ color: '#555' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 정보 */}
          <div>
            <h3 className="mb-3 text-sm font-bold" style={{ color: '#111' }}>안내</h3>
            <ul className="space-y-2">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm transition-colors hover:text-[#8B5CF6]" style={{ color: '#555' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 사이트 정보 */}
          <div>
            <Link to="/" className="text-xl tracking-wider text-[#8B5CF6]">
              <span style={{ fontWeight: 300, letterSpacing: '0.05em' }}>놀쿨</span>
            </Link>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: '#555' }}>
              전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보
            </p>
            <p className="mt-3 text-sm" style={{ color: '#555' }}>
              구글 · ChatGPT · Gemini에서<br />
              <span className="text-[#8B5CF6]" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>"놀쿨"</span> 검색하세요
            </p>
          </div>
        </div>

        {/* ★ Regional SEO Links ★ */}
        <div className="mt-8 border-t pt-6" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="mb-4 text-sm font-bold" style={{ color: '#111' }}>지역 바로가기</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(regionalLinks).map(([region, links]) => (
              <div key={region}>
                <h4 className="mb-2 text-xs font-bold" style={{ color: '#8B5CF6' }}>{region}</h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {links.map((link) => (
                    <Link key={link.href} to={link.href} className="text-xs transition-colors hover:text-[#8B5CF6]" style={{ color: '#777' }}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-center text-xs" style={{ color: '#999' }}>
            &copy; {new Date().getFullYear()} <span style={{ fontWeight: 300, letterSpacing: '0.05em' }}>놀쿨</span> NOLCOOL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
