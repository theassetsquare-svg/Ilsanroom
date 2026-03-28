import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import BackToTop from '@/components/layout/BackToTop';
import Toast from '@/components/ui/Toast';
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
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <Header />
      <div className="border-b border-neon-border bg-neon-surface">
        <p className="mx-auto max-w-[1200px] px-4 py-2 text-center text-xs text-neon-text-muted">
          만 19세 이상만 들어올 수 있어요
        </p>
      </div>
      <main className="flex-1 pt-16 pb-20 md:pb-14">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <BackToTop />
      <Toast />
      <Suspense fallback={null}>
        <GlobalEngagement />
      </Suspense>
    </div>
  );
}
