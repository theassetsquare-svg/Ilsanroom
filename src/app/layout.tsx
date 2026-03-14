import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Toast from '@/components/ui/Toast';
import RetargetingPixels from '@/components/seo/RetargetingPixels';
import SentryInit from '@/components/seo/SentryInit';
import AgeVerification from '@/components/popups/AgeVerification';
import CookieConsent from '@/components/popups/CookieConsent';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: {
    default: 'NEON | 대한민국 No.1 나이트라이프 가이드',
    template: '%s | NEON 나이트라이프',
  },
  description:
    '대한민국 최고의 나이트라이프 가이드 NEON. 클럽, 나이트, 라운지, 룸, 요정, 호빠 정보를 한눈에. 지역별 업소 검색, 리뷰, 분위기, 이벤트 정보 제공.',
  keywords: [
    '나이트라이프',
    '클럽',
    '나이트',
    '라운지',
    '룸',
    '요정',
    '호빠',
    '강남 클럽',
    '홍대 클럽',
    '강남 나이트',
    '일산 요정',
    '일산 룸',
  ],
  authors: [{ name: 'NEON' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'NEON 나이트라이프',
    title: 'NEON | 대한민국 No.1 나이트라이프 가이드',
    description:
      '클럽, 나이트, 라운지, 룸, 요정, 호빠 — 대한민국 나이트라이프 정보를 NEON에서 확인하세요.',
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className={`${notoSansKR.className} bg-neon-bg text-neon-text antialiased`}>
        {/* GA4 */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`} />
            <script dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA4_ID}');`
            }} />
          </>
        )}
        <RetargetingPixels />
        <SentryInit />
        {children}
        <Toast />
        <AgeVerification />
        <CookieConsent />
      </body>
    </html>
  );
}
