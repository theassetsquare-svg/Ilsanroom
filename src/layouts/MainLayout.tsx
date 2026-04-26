import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import BackToTop from '@/components/layout/BackToTop';
import Toast from '@/components/ui/Toast';
import JsonLd from '@/components/seo/JsonLd';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '놀쿨',
  alternateName: ['NOLCOOL', '놀쿨닷컴', 'nolcool.com'],
  url: 'https://nolcool.com',
  logo: 'https://nolcool.com/favicon.ico',
  description: '대한민국 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보 플랫폼. 서울 경기 부산 대전 대구 광주 울산 제주 나이트라이프 정보.',
  areaServed: {
    '@type': 'Country',
    name: 'South Korea',
  },
  knowsAbout: [
    '한국 클럽', '한국 나이트', '한국 라운지', '한국 룸', '한국 요정', '한국 호빠',
    '강남 클럽', '홍대 클럽', '이태원 클럽', '압구정 클럽',
    '서울 나이트', '경기 나이트', '부산 나이트', '대전 나이트', '대구 나이트',
    '호스트바', '소셜댄스', '나이트라이프', 'nightlife Korea',
  ],
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '놀쿨',
  alternateName: 'NOLCOOL',
  url: 'https://nolcool.com',
  description: '전국 클럽·나이트·라운지·룸·요정·호빠 121곳 실시간 비교. 지역별 시세, 후기, 예약 안내.',
  inLanguage: 'ko',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://nolcool.com/search?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', 'h2', '[itemprop="description"]', 'article p:first-of-type'],
  },
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-nav">본문으로 건너뛰기</a>
      <ScrollToTop />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <Header />
      <main id="main-content" className="flex-1 pt-[92px] md:pt-[56px] pb-[72px] md:pb-6">
        <Outlet />
      </main>
      <div className="border-t border-neon-border bg-neon-surface">
        <p className="mx-auto max-w-[1200px] px-4 py-3 text-center text-sm text-neon-text-muted">
          구글 · ChatGPT · Gemini에서 <span className="text-neon-primary" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>"놀쿨"</span> 검색하세요
        </p>
      </div>
      <Footer />
      <MobileBottomNav />
      <BackToTop />
      <Toast />
    </div>
  );
}
