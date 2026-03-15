import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Toast from '@/components/ui/Toast';
import ThemeProvider from '@/components/ui/ThemeProvider';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: {
    default: '오늘밤어디 — 전국 야간 업소 정보',
    template: '%s | 오늘밤어디',
  },
  description:
    '전국 야간 업소 정보를 한곳에서. 지역별 검색, 리뷰, 이벤트 정보를 확인하세요.',
  keywords: [
    '일산룸', '일산명월관요정', '나이트라이프',
  ],
  authors: [{ name: '오늘밤어디' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '오늘밤어디',
    title: '오늘밤어디 — 전국 야간 업소 정보',
    description:
      '전국 클럽·나이트·라운지·룸·요정·호빠 정보를 한곳에서.',
    url: 'https://ilsanroom.pages.dev',
    images: [{ url: 'https://ilsanroom.pages.dev/og/default.svg', width: 1200, height: 630, alt: '전국 클럽·나이트·라운지·룸·요정·호빠 정보' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '전국 클럽·나이트·라운지·룸·요정·호빠 정보',
    description: '전국 클럽·나이트·라운지·룸·요정·호빠 정보를 한곳에서.',
    images: ['https://ilsanroom.pages.dev/og/default.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'HJjm7MRxykCQ7d_9L7glaTeeaWrmJIzAKY0BcNcfm88',
    other: {
      'naver-site-verification': 'e2bdcc448d2478d84e7d457455eaf954fcb24cd9',
    },
  },
  alternates: {
    canonical: 'https://ilsanroom.pages.dev',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B5CF6',
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
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://ilsanroom.pages.dev/map?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Pretendard font preload */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-neon-bg text-neon-text antialiased">
        <ThemeProvider>
          <JsonLd data={organizationJsonLd} />
          <JsonLd data={websiteJsonLd} />
          {children}
          <Toast />
        </ThemeProvider>

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
