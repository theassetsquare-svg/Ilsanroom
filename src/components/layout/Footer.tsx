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
    <footer style={{ backgroundColor: '#FAFAFA', borderTop: '1px solid #E5E7EB' }}>
      <div className="mx-auto max-w-[1200px] px-4 py-10">

        {/* ★ 광고문의 배너 — 깔끔하고 세련되게 ★ */}
        <div
          className="mb-10 rounded-2xl px-6 py-7 text-center"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 40%, #A78BFA 100%)',
            boxShadow: '0 4px 24px rgba(139, 92, 246, 0.2)',
          }}
        >
          <p className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            BUSINESS INQUIRY
          </p>
          <p className="text-lg font-bold text-white mb-1">
            광고문의
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 mb-4">
            <span
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-base font-bold"
              style={{ backgroundColor: '#FEE500', color: '#191600', letterSpacing: '0.02em' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.66 6.6l-.96 3.56c-.08.3.26.54.52.37l4.26-2.82c.49.06.99.09 1.52.09 5.52 0 10-3.58 10-7.9S17.52 3 12 3z" fill="#191600"/></svg>
              besta12
            </span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            카카오톡으로 편하게 문의하세요
          </p>
          <Link
            to="/for-business"
            className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-bold transition active:scale-[0.97]"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFF', border: '1px solid rgba(255,255,255,0.25)', minHeight: 44 }}
          >
            업주 전용 안내 보기
          </Link>
        </div>

        {/* 링크 그리드 */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
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

          <div>
            <Link to="/" className="text-xl text-[#8B5CF6]">
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

        {/* 지역 바로가기 */}
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

        {/* 하단 카피라이트 */}
        <div className="mt-8 border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-center text-xs" style={{ color: '#999' }}>
            &copy; {new Date().getFullYear()} <span style={{ fontWeight: 300, letterSpacing: '0.05em' }}>놀쿨</span> NOLCOOL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
