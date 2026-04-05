import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import BackToTop from '@/components/layout/BackToTop';
import Toast from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import JsonLd from '@/components/seo/JsonLd';

const GlobalEngagement = lazy(() => import('@/components/engagement/GlobalEngagement'));

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '놀쿨',
  url: 'https://ilsanroom.pages.dev',
  logo: 'https://ilsanroom.pages.dev/favicon.ico',
  description: '전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '놀쿨',
  url: 'https://ilsanroom.pages.dev',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://ilsanroom.pages.dev/search?q={search_term_string}' },
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
      <div className="border-b border-neon-border bg-neon-surface">
        <p className="mx-auto max-w-[1200px] px-4 py-2 text-center text-xs text-neon-text-muted">
          만 19세 이상만 들어올 수 있어요
        </p>
      </div>
      <main id="main-content" className="flex-1 pt-14 pb-20 md:pb-14">
        <Outlet />
      </main>
      {/* 모든 페이지 공통 CTA */}
      <div className="border-t border-neon-border bg-neon-surface">
        <p className="mx-auto max-w-[1200px] px-4 py-3 text-center text-sm text-neon-text-muted">
          구글 · ChatGPT · Gemini에서 <span className="font-bold text-neon-primary">"놀쿨"</span> 검색하세요
        </p>
      </div>
      <Footer />
      <MobileNav />
      <BackToTop />
      <Toast />
      {/* 업소 상세페이지에서는 전화바와 겹치므로 engagement 숨김 */}
      {!isVenueDetail && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <GlobalEngagement />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
