import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import BackToTop from '@/components/layout/BackToTop';
import LiveVisitors from '@/components/ui/LiveVisitors';
import ExitIntent from '@/components/popups/ExitIntent';
import SocialProof from '@/components/saas/SocialProof';
import KakaoChannel from '@/components/ui/KakaoChannel';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
      <BackToTop />
      <LiveVisitors />
      <ExitIntent />
      <SocialProof />
      <KakaoChannel />
    </div>
  );
}
