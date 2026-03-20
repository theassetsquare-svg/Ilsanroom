'use client';

import { useState } from 'react';
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
  { href: '/community', label: '게시판' },
  { href: '/events', label: '행사' },
  { href: '/ranking', label: '순위' },
  { href: '/magazine', label: '읽을거리' },
  { href: '/quiz', label: '테스트' },
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

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      {submitted ? (
        <p className="text-sm font-medium text-neon-green">구독 완료! 감사합니다.</p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="flex-1 rounded-xl border border-neon-border bg-white px-4 py-2.5 text-sm text-neon-text placeholder:text-neon-text-subtle focus:border-neon-primary focus:outline-none"
            required
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neon-primary-light"
          >
            구독
          </button>
        </>
      )}
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-neon-border bg-neon-surface pb-20 md:pb-0">
      <div className="mx-auto max-w-[1200px] px-4 py-12">
        {/* ★★★ 광고문의 — 푸터 최상단, 모든 페이지 ★★★ */}
        <div className="mb-10 rounded-2xl border-2 border-neon-primary/30 bg-gradient-to-r from-violet-50 to-white px-6 py-6 text-center">
          <p className="text-xl font-extrabold text-neon-text sm:text-2xl">
            광고문의 카톡{' '}
            <span className="inline-block rounded-xl bg-neon-primary px-5 py-1.5 text-white">besta12</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Site info */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" target="_blank" rel="noopener noreferrer" className="text-xl font-black tracking-wider text-neon-primary">
              오늘밤어디
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-neon-text-muted">
              전국 클럽·나이트·라운지·룸·요정·호빠 정보
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neon-text">둘러보기</h3>
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
            <h3 className="mb-3 text-sm font-semibold text-neon-text">참여</h3>
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
          <h3 className="mb-4 text-sm font-semibold text-neon-text">지역 바로가기</h3>
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


        {/* Newsletter */}
        <div className="mt-8 border-t border-neon-border pt-6">
          <div className="mx-auto max-w-md text-center">
            <h3 className="mb-2 text-sm font-semibold text-neon-text">주간 소식 받기</h3>
            <p className="mb-3 text-xs text-neon-text-muted">새로운 업소, 이벤트, 인기 순위를 매주 이메일로</p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-neon-border pt-6">
          <p className="text-center text-xs text-neon-text-muted">
            &copy; {new Date().getFullYear()} 오늘밤어디. All rights reserved.
          </p>
          <p className="mt-2 text-center text-xs text-neon-text-muted">
            직접 확인하고 전문가가 분석합니다
          </p>
        </div>
      </div>
    </footer>
  );
}
