import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import BackToTop from '@/components/layout/BackToTop';
import KakaoChannel from '@/components/ui/KakaoChannel';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* 19세 안내 — 텍스트 배너 (팝업 아님) */}
      <div className="bg-neon-surface border-b border-neon-border">
        <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs text-neon-text-muted">
          본 사이트는 만 19세 이상 이용 가능합니다
        </p>
      </div>
      <main className="flex-1 pt-16 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
      <BackToTop />
      <KakaoChannel />
    </div>
  );
}
