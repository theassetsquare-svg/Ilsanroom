import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Toast from '@/components/ui/Toast';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: {
    default: '오늘밤어디 — 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
    template: '%s | 오늘밤어디',
  },
  description:
    '전국 클럽·나이트·라운지·룸·요정·호빠 정보를 한곳에서. 지역별 검색, 실시간 인기 업소, 첫 방문 가이드까지.',
  keywords: ['일산룸', '일산명월관요정', '강남클럽', '부산나이트', '호빠', '라운지'],
  authors: [{ name: '오늘밤어디' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '오늘밤어디',
    title: '오늘밤어디 — 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
    description: '전국 클럽·나이트·라운지·룸·요정·호빠 정보를 한곳에서.',
    url: 'https://ilsanroom.pages.dev',
    images: [{ url: 'https://ilsanroom.pages.dev/api/og?title=%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94&subtitle=%EC%A0%84%EA%B5%AD+%EB%B0%A4%EB%AC%B8%ED%99%94+%EC%8B%A4%EC%8B%9C%EA%B0%84+%EC%A0%95%EB%B3%B4&bg=%238B5CF6', width: 1200, height: 630, alt: '오늘밤어디 — 전국 클럽·나이트·라운지·룸·요정·호빠' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '오늘밤어디 — 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
    description: '전국 클럽·나이트·라운지·룸·요정·호빠 정보를 한곳에서.',
    images: ['https://ilsanroom.pages.dev/api/og?title=%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94&subtitle=%EC%A0%84%EA%B5%AD+%EB%B0%A4%EB%AC%B8%ED%99%94+%EC%8B%A4%EC%8B%9C%EA%B0%84+%EC%A0%95%EB%B3%B4&bg=%238B5CF6'],
  },
  robots: { index: true, follow: true },
  verification: {
    google: 'HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88',
    other: { 'naver-site-verification': 'e2bdcc448d2478d84e7d457455eaf954fcb24cd9' },
  },
  alternates: { canonical: 'https://ilsanroom.pages.dev' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F8F8FC',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '오늘밤어디',
  url: 'https://ilsanroom.pages.dev',
  logo: 'https://ilsanroom.pages.dev/favicon.ico',
  description: '전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '오늘밤어디',
  url: 'https://ilsanroom.pages.dev',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://ilsanroom.pages.dev/map?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-neon-bg text-neon-text antialiased">
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        {children}
        <Toast />

        {/* GA4 — lazyOnload for CWV */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="lazyOnload"
            />
            <Script id="ga4-init" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA4_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
