import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { RewardToastProvider } from './components/community/RewardToast';
import { installVisitorTracker, trackPageView } from './lib/visitor-tracker';

/* chunk load 실패 시 자동 재시도 (배포 후 구 chunk 404 대응) */
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      // 1회 재시도 후에도 실패하면 새로고침
      return factory().catch(() => {
        window.location.reload();
        return { default: () => null };
      });
    })
  );
}

/* ── Pages (lazy-loaded with retry) ── */
const HomePage = lazyRetry(() => import('./pages/HomePage'));
const ClubsPage = lazyRetry(() => import('./pages/ClubsPage'));
const RegionalClubsPage = lazyRetry(() => import('./pages/RegionalClubsPage'));
const ClubDetailPage = lazyRetry(() => import('./pages/ClubDetailPage'));
const NightsPage = lazyRetry(() => import('./pages/NightsPage'));
const NightDetailPage = lazyRetry(() => import('./pages/NightDetailPage'));
const LoungesPage = lazyRetry(() => import('./pages/LoungesPage'));
const LoungeDetailPage = lazyRetry(() => import('./pages/LoungeDetailPage'));
const RoomsPage = lazyRetry(() => import('./pages/RoomsPage'));
const RegionalRoomsPage = lazyRetry(() => import('./pages/RegionalRoomsPage'));
const RoomDetailPage = lazyRetry(() => import('./pages/RoomDetailPage'));
const YojeongPage = lazyRetry(() => import('./pages/YojeongPage'));
const RegionalYojeongPage = lazyRetry(() => import('./pages/RegionalYojeongPage'));
const YojeongDetailPage = lazyRetry(() => import('./pages/YojeongDetailPage'));
const HoppaPage = lazyRetry(() => import('./pages/HoppaPage'));
const HoppaDetailPage = lazyRetry(() => import('./pages/HoppaDetailPage'));
const GuidePage = lazyRetry(() => import('./pages/GuidePage'));
const QuizPage = lazyRetry(() => import('./pages/QuizPage'));
const RoulettePage = lazyRetry(() => import('./pages/RoulettePage'));
const VSPage = lazyRetry(() => import('./pages/VSPage'));
const RankingPage = lazyRetry(() => import('./pages/RankingPage'));
const PricePage = lazyRetry(() => import('./pages/PricePage'));
const ComparePage = lazyRetry(() => import('./pages/ComparePage'));
const SearchPage = lazyRetry(() => import('./pages/SearchPage'));
const TonightPage = lazyRetry(() => import('./pages/TonightPage'));
const WeekendPage = lazyRetry(() => import('./pages/WeekendPage'));
const BudgetPage = lazyRetry(() => import('./pages/BudgetPage'));
const OccasionPage = lazyRetry(() => import('./pages/OccasionPage'));
const MagazinePage = lazyRetry(() => import('./pages/MagazinePage'));
const MagazineDetailPage = lazyRetry(() => import('./pages/MagazineDetailPage'));
const CommunityPage = lazyRetry(() => import('./pages/community/CommunityPage'));
const QnAPage = lazyRetry(() => import('./pages/community/QnAPage'));
const ReviewsPage = lazyRetry(() => import('./pages/community/ReviewsPage'));
const TipsPage = lazyRetry(() => import('./pages/community/TipsPage'));
const PartyPage = lazyRetry(() => import('./pages/community/PartyPage'));
const FreePage = lazyRetry(() => import('./pages/community/FreePage'));
const FashionPage = lazyRetry(() => import('./pages/community/FashionPage'));
const GuidelinesPage = lazyRetry(() => import('./pages/community/GuidelinesPage'));
const JogakPage = lazyRetry(() => import('./pages/community/JogakPage'));
const PrivacyPage = lazyRetry(() => import('./pages/PrivacyPage'));
const PrivacyPromisePage = lazyRetry(() => import('./pages/PrivacyPromisePage'));
const WelcomePage = lazyRetry(() => import('./pages/WelcomePage'));
const TermsPage = lazyRetry(() => import('./pages/TermsPage'));
const DisclaimerPage = lazyRetry(() => import('./pages/DisclaimerPage'));
const VenueTermsPage = lazyRetry(() => import('./pages/VenueTermsPage'));
const SafetyPage = lazyRetry(() => import('./pages/SafetyPage'));
const LegalPage = lazyRetry(() => import('./pages/LegalPage'));
const HelpPage = lazyRetry(() => import('./pages/HelpPage'));
const TestimonialsPage = lazyRetry(() => import('./pages/TestimonialsPage'));
const StatusPage = lazyRetry(() => import('./pages/StatusPage'));
const ReferralPage = lazyRetry(() => import('./pages/ReferralPage'));
const HiddenPage = lazyRetry(() => import('./pages/HiddenPage'));
const DemoPage = lazyRetry(() => import('./pages/DemoPage'));
const GalleryPage = lazyRetry(() => import('./pages/GalleryPage'));
const CaseStudiesPage = lazyRetry(() => import('./pages/CaseStudiesPage'));
const PricingPage = lazyRetry(() => import('./pages/PricingPage'));
const EventsPage = lazyRetry(() => import('./pages/EventsPage'));
const PrintPage = lazyRetry(() => import('./pages/PrintPage'));
const LoginPage = lazyRetry(() => import('./pages/auth/LoginPage'));
const ProfilePage = lazyRetry(() => import('./pages/auth/ProfilePage'));
const AuthCallbackPage = lazyRetry(() => import('./pages/auth/AuthCallbackPage'));
const NaverCallbackPage = lazyRetry(() => import('./pages/auth/NaverCallbackPage'));
const SetupNicknamePage = lazyRetry(() => import('./pages/auth/SetupNicknamePage'));
const DashboardPage = lazyRetry(() => import('./pages/admin/DashboardPage'));
const AdminPage = lazyRetry(() => import('./pages/admin/AdminPage'));
const AnalyticsPage = lazyRetry(() => import('./pages/admin/AnalyticsPage'));
const BillingPage = lazyRetry(() => import('./pages/admin/BillingPage'));
const OnboardingPage = lazyRetry(() => import('./pages/admin/OnboardingPage'));
const LaunchPage = lazyRetry(() => import('./pages/admin/LaunchPage'));
const VenueManagePage = lazyRetry(() => import('./pages/admin/VenueManagePage'));
const MagazineManagePage = lazyRetry(() => import('./pages/admin/MagazineManagePage'));
const MediaLibraryPage = lazyRetry(() => import('./pages/admin/MediaLibraryPage'));
const SeoOverridesPage = lazyRetry(() => import('./pages/admin/SeoOverridesPage'));
const PageBlocksPage = lazyRetry(() => import('./pages/admin/PageBlocksPage'));
const ModerationPage = lazyRetry(() => import('./pages/admin/ModerationPage'));
const StatsPage = lazyRetry(() => import('./pages/admin/StatsPage'));
const VisitorAnalyticsPage = lazyRetry(() => import('./pages/admin/VisitorAnalyticsPage'));
const AuditReportPage = lazyRetry(() => import('./pages/admin/AuditReportPage'));
const PostDetailPage = lazyRetry(() => import('./pages/community/PostDetailPage'));
const NightlifeGuidePage = lazyRetry(() => import('./pages/lead/NightlifeGuidePage'));
const LeadQuizPage = lazyRetry(() => import('./pages/lead/LeadQuizPage'));
const WeeklyHotPage = lazyRetry(() => import('./pages/lead/WeeklyHotPage'));
const WaitlistPage = lazyRetry(() => import('./pages/WaitlistPage'));
const MyReferralsPage = lazyRetry(() => import('./pages/my/MyReferralsPage'));
const MyCustomizePage = lazyRetry(() => import('./pages/my/MyCustomizePage'));
const MessagesPage = lazyRetry(() => import('./pages/MessagesPage'));
const NotFoundPage = lazyRetry(() => import('./pages/NotFoundPage'));
/* ── Lounge Pages ── */
const LoungeIndexPage = lazyRetry(() => import('./pages/community/LoungeIndexPage'));
const LoungePage = lazyRetry(() => import('./pages/community/LoungePage'));
/* ── SEO Dynamic Pages ── */
const BestCategoryPage = lazyRetry(() => import('./pages/seo/BestCategoryPage'));
const NewCategoryPage = lazyRetry(() => import('./pages/seo/NewCategoryPage'));
const RegionLandingPage = lazyRetry(() => import('./pages/seo/RegionLandingPage'));
const RegionCategoryPage = lazyRetry(() => import('./pages/seo/RegionCategoryPage'));
const TagPage = lazyRetry(() => import('./pages/seo/TagPage'));
const NearStationPage = lazyRetry(() => import('./pages/seo/NearStationPage'));

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  useEffect(() => { installVisitorTracker(); }, []);
  useEffect(() => { trackPageView(location.pathname); }, [location.pathname]);
  return (
    <ErrorBoundary resetKey={location.pathname}>
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          {/* Category listing */}
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/clubs/:region" element={<RegionalClubsPage />} />
          <Route path="/clubs/:region/:slug" element={<ErrorBoundary resetKey={location.pathname}><ClubDetailPage /></ErrorBoundary>} />
          <Route path="/nights" element={<NightsPage />} />
          <Route path="/nights/:slug" element={<ErrorBoundary resetKey={location.pathname}><NightDetailPage /></ErrorBoundary>} />
          <Route path="/lounges" element={<LoungesPage />} />
          <Route path="/lounges/:slug" element={<ErrorBoundary resetKey={location.pathname}><LoungeDetailPage /></ErrorBoundary>} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:region" element={<RegionalRoomsPage />} />
          <Route path="/rooms/:region/:slug" element={<ErrorBoundary resetKey={location.pathname}><RoomDetailPage /></ErrorBoundary>} />
          <Route path="/yojeong" element={<YojeongPage />} />
          <Route path="/yojeong/:region" element={<RegionalYojeongPage />} />
          <Route path="/yojeong/:region/:slug" element={<ErrorBoundary resetKey={location.pathname}><YojeongDetailPage /></ErrorBoundary>} />
          <Route path="/hoppa" element={<HoppaPage />} />
          <Route path="/hoppa/:slug" element={<ErrorBoundary resetKey={location.pathname}><HoppaDetailPage /></ErrorBoundary>} />
          {/* Interactive */}
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/roulette" element={<RoulettePage />} />
          <Route path="/vs" element={<VSPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/venue-info" element={<PricePage />} />
          <Route path="/price" element={<Navigate to="/venue-info" replace />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tonight" element={<TonightPage />} />
          <Route path="/weekend" element={<WeekendPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/occasion" element={<OccasionPage />} />
          <Route path="/magazine" element={<MagazinePage />} />
          <Route path="/magazine/:id" element={<MagazineDetailPage />} />
          {/* Community */}
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/qna" element={<QnAPage />} />
          <Route path="/community/reviews" element={<ReviewsPage />} />
          <Route path="/community/tips" element={<TipsPage />} />
          <Route path="/community/party" element={<PartyPage />} />
          <Route path="/community/free" element={<FreePage />} />
          <Route path="/community/fashion" element={<FashionPage />} />
          <Route path="/community/jogak" element={<JogakPage />} />
          <Route path="/community/guidelines" element={<GuidelinesPage />} />
          <Route path="/community/post/:id" element={<ErrorBoundary resetKey={location.pathname}><PostDetailPage /></ErrorBoundary>} />
          {/* Lounge */}
          <Route path="/lounge" element={<LoungeIndexPage />} />
          <Route path="/lounge/:type" element={<LoungePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          {/* Legal & Info */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/privacy-promise" element={<PrivacyPromisePage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/venue-terms" element={<VenueTermsPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/help" element={<HelpPage />} />
          {/* Business */}
          <Route path="/for-business" element={<Navigate to="/pricing" replace />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          {/* Misc */}
          <Route path="/status" element={<StatusPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          {/* Lead magnets */}
          <Route path="/lead/nightlife-guide" element={<NightlifeGuidePage />} />
          <Route path="/lead/quiz" element={<LeadQuizPage />} />
          <Route path="/lead/weekly-hot" element={<WeeklyHotPage />} />
          {/* Growth */}
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/my/referrals" element={<MyReferralsPage />} />
          <Route path="/my/customize" element={<MyCustomizePage />} />
          <Route path="/hidden" element={<HiddenPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/print/:slug" element={<PrintPage />} />
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/naver-callback" element={<NaverCallbackPage />} />
          <Route path="/setup-nickname" element={<SetupNicknamePage />} />
          {/* Legacy admin (사이트 레이아웃 유지) */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/launch" element={<LaunchPage />} />
          {/* SEO Dynamic Pages */}
          <Route path="/best/:category" element={<BestCategoryPage />} />
          <Route path="/new/:category" element={<NewCategoryPage />} />
          <Route path="/region/:region" element={<RegionLandingPage />} />
          <Route path="/region/:region/:category" element={<RegionCategoryPage />} />
          <Route path="/tag/:tag" element={<TagPage />} />
          <Route path="/near/:station" element={<NearStationPage />} />
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Admin (사이드바 레이아웃) — 단계 7 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />
          <Route path="venues" element={<VenueManagePage />} />
          <Route path="magazine" element={<MagazineManagePage />} />
          <Route path="media" element={<MediaLibraryPage />} />
          <Route path="seo" element={<SeoOverridesPage />} />
          <Route path="blocks" element={<PageBlocksPage />} />
          <Route path="moderation" element={<ModerationPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="visitors" element={<VisitorAnalyticsPage />} />
          <Route path="audit" element={<AuditReportPage />} />
        </Route>
      </Routes>
    </Suspense>
    <RewardToastProvider />
    </ErrorBoundary>
  );
}
