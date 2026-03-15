import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import BackToTop from '@/components/layout/BackToTop';
import ExitIntent from '@/components/popups/ExitIntent';
import NewsletterPopup from '@/components/popups/NewsletterPopup';
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
      <ExitIntent />
      <NewsletterPopup />
      <KakaoChannel />
    </div>
  );
}
