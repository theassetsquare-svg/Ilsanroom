import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Toast from '@/components/ui/Toast';
import AgeVerification from '@/components/popups/AgeVerification';
import CookieConsent from '@/components/popups/CookieConsent';
import ThemeProvider from '@/components/ui/ThemeProvider';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: {
    default: '일산룸포털 | 일산 룸·요정·나이트·라운지·클럽·호빠 정보',
    template: '%s | 일산룸포털',
  },
  description:
    '일산룸포털은 일산 룸, 요정, 나이트, 라운지, 클럽, 호빠 업소 정보를 한곳에 모은 대한민국 나이트라이프 포털입니다. 지역별 업소 검색, 리뷰, 이벤트 정보를 확인하세요.',
  keywords: [
    '일산룸', '일산요정', '일산나이트', '일산라운지', '일산클럽', '일산호빠',
    '일산명월관요정', '강남클럽', '홍대클럽', '강남나이트', '강남라운지',
    '부산클럽', '부산나이트', '나이트라이프', '룸', '요정', '호빠',
  ],
  authors: [{ name: '일산룸포털' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '일산룸포털',
    title: '일산룸포털 | 일산 룸·요정·나이트·라운지·클럽·호빠 정보',
    description:
      '일산 룸, 요정, 나이트, 라운지, 클럽, 호빠 업소 정보를 일산룸포털에서 확인하세요.',
    url: 'https://ilsanroom.pages.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: '일산룸포털 | 일산 룸·요정·나이트·라운지·클럽·호빠 정보',
    description: '일산 룸, 요정, 나이트, 라운지, 클럽, 호빠 업소 정보를 한곳에서.',
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
  name: '일산룸포털',
  url: 'https://ilsanroom.pages.dev',
  logo: 'https://ilsanroom.pages.dev/favicon.ico',
  description: '일산 룸, 요정, 나이트, 라운지, 클럽, 호빠 업소 정보 포털',
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '일산룸포털',
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
          <AgeVerification />
          <CookieConsent />
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
