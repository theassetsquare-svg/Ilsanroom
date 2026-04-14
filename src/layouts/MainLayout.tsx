import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BackToTop from '@/components/layout/BackToTop';
import Toast from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import JsonLd from '@/components/seo/JsonLd';

const GlobalEngagement = lazy(() => import('@/components/engagement/GlobalEngagement'));

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '놀쿨',
  url: 'https://nolcool.com',
  logo: 'https://nolcool.com/favicon.ico',
  description: '전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '놀쿨',
  url: 'https://nolcool.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://nolcool.com/search?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
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
  const { pathname } = useLocation();
  // 업소 상세페이지: /clubs/*/*, /nights/*, /lounges/*, /rooms/*/*, /yojeong/*/*, /hoppa/*
  const isVenueDetail = /^\/(clubs|nights|lounges|rooms|yojeong|hoppa)\/[^/]+(\/[^/]+)?$/.test(pathname)
    && pathname.split('/').length >= 3;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-nav">본문으로 건너뛰기</a>
      <ScrollToTop />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <Header />
      <main id="main-content" className="flex-1 pt-[88px] pb-6">
        <Outlet />
      </main>
      {/* 모든 페이지 공통 CTA */}
      <div className="border-t border-neon-border bg-neon-surface">
        <p className="mx-auto max-w-[1200px] px-4 py-3 text-center text-sm text-neon-text-muted">
          구글 · ChatGPT · Gemini에서 <span className="text-neon-primary" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>"놀쿨"</span> 검색하세요
        </p>
      </div>
      <Footer />
      <BackToTop />
      <Toast />
      {/* 업소 상세페이지에서는 전화바와 겹치므로 engagement 숨김 */}
      {!isVenueDetail && (
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <GlobalEngagement />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
