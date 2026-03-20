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
    '130여 곳의 솔직 후기, 가격 정보, 분위기 사진을 한 곳에 모았습니다. 원하는 조건으로 필터링하세요.',
  keywords: ['일산룸', '일산명월관요정', '강남청담클럽', '부산나이트', '호빠', '라운지'],
  authors: [{ name: '오늘밤어디' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '오늘밤어디',
    title: '솔직한 후기로 고르는 야간 문화 비교 서비스',
    description: '130여 곳의 솔직 후기, 가격 정보, 분위기 사진을 한 곳에 모았습니다. 원하는 조건으로 필터링하세요.',
    url: 'https://ilsanroom.pages.dev',
    images: [{ url: 'https://ilsanroom.pages.dev/og/main.svg', width: 1200, height: 630, alt: '전국 야간 문화 비교 서비스' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '오늘밤어디 — 솔직 후기로 고르는 야간 문화 비교',
    description: '130여 곳 후기·가격·사진을 모아 원하는 조건으로 필터링.',
    images: ['https://ilsanroom.pages.dev/og/main.svg'],
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
  themeColor: '#F5F5F5',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '오늘밤어디',
  url: 'https://ilsanroom.pages.dev',
  logo: 'https://ilsanroom.pages.dev/favicon.ico',
  description: '솔직한 후기로 고르는 야간 문화 비교 서비스',
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
      <body className="bg-[#F5F5F5] text-[#111111] antialiased">
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
