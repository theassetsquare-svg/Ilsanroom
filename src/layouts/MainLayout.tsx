import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import SsrArticle from '@/components/seo/SsrArticle';
import WelcomeBenefits from '@/components/member/WelcomeBenefits'; // [놀쿨11-5] 가입 즉시 혜택 3가지(한 번만)
import { useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import BackToTop from '@/components/layout/BackToTop';
import ScrollProgress from '@/components/layout/ScrollProgress';
import SavedVenuesBar from '@/components/venue/SavedVenuesBar';
import RecentVenuesBar from '@/components/venue/RecentVenuesBar';
import CompareBar from '@/components/venue/CompareBar';
import Toast from '@/components/ui/Toast';
import SecretModeToast from '@/components/privacy/SecretModeToast';
import { useSeoOverride } from '@/hooks/useSeoOverride';

// [놀쿨34-1 · G7] 여기 있던 Organization · WebSite JSON-LD 두 개는 뺐다.
//   이 틀은 모든 쪽을 감싸므로, 브라우저가 그린 뒤에는 가게 쪽을 포함한 모든 쪽에 Organization 이 붙어 있었다(34-1 실측 75/75쪽 · 홈은 2개).
//   구글 organization 문서: 홈(또는 소개 쪽) 한 곳이면 된다. 홈의 Organization · WebSite 는 프리렌더가 머리(head)에 넣는 것 하나만 쓴다(scripts/prerender-seo.mjs ORG_JSONLD · WEBSITE_JSONLD).
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    // [놀쿨12-2 · 13:18-11 「뒤로 가기 자리 기억」] 뒤로·앞으로(POP)는 맨 위로 올리지 않는다 — 목록이 보던 자리를 되살린다(VenueListClient)
    if (navType === 'POP') return;
    window.scrollTo(0, 0);
  }, [pathname, navType]);
  return null;
}

/** [놀쿨12-2 · P4] 첫 쪽의 프리렌더 JSON-LD(head 안 · React 의 JsonLd 는 body 에 그린다)는 그 쪽 것이다 — 사이트 안에서 다른 쪽으로 옮기면 지운다(앞 가게 전화번호가 다음 쪽 머리에 남던 것) */
function SsrPageLdCleaner() {
  const { pathname } = useLocation();
  const first = useRef(pathname);
  useEffect(() => {
    if (pathname !== first.current) document.head.querySelectorAll('script[type="application/ld+json"]').forEach((n) => n.remove());
  }, [pathname]);
  return null;
}

function SeoOverrideRunner() {
  useSeoOverride();
  return null;
}

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col pb-[72px] md:pb-0">
      <a href="#main-content" className="skip-nav">본문으로 건너뛰기</a>
      <ScrollToTop />
      <SsrPageLdCleaner />
      <SeoOverrideRunner />
      <ScrollProgress />
      <Header />
      {/* [놀쿨34-1 · 흔들림] 본문 칸은 처음부터 첫 화면 높이 이상(min-h-screen) — 내용이 짧은 쪽에서 아래 띠·푸터가 첫 화면 안에 걸려 있다가
          프리렌더 본문(SsrArticle)이 들어올 때 밀려 내려가는 흔들림을 없앤다(사이트 안에서 옮겨 와 본문을 늦게 받는 때도 같다). 숨김 0 · 글자 변화 0. */}
      <main id="main-content" className="flex-1 min-h-screen pt-[92px] md:pt-[56px] pb-[72px] md:pb-6">
        <Outlet />
        {/* [놀쿨11-2] 프리렌더 완독 뼈대 본문을 끌어안는 자리 — 크롤러와 사람이 같은 본문 */}
        <WelcomeBenefits />
        <SsrArticle />
      </main>
      {/* 찜한 업소 재노출 바 (찜 > 0일 때만 표시) — 의도적 저장이라 최근 본 위에 */}
      <SavedVenuesBar />
      {/* 시즌157A — 최근 본 venue 영구 바 (items > 0일 때만 자동 표시) */}
      <RecentVenuesBar />
      <div className="border-t border-neon-border bg-neon-surface">
        <p className="mx-auto max-w-[1200px] px-4 py-3 text-center text-sm text-neon-text-muted">
          구글 · ChatGPT · Gemini에서 <span className="text-neon-primary" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>"놀쿨"</span> 검색하세요
        </p>
      </div>
      <Footer />
      <MobileBottomNav />
      {/* 시즌157C — 비교 선택 sticky bar (items > 0일 때만 표시) */}
      <CompareBar />
      <BackToTop />
      <Toast />
      <SecretModeToast />
    </div>
  );
}
