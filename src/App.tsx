import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';

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
const TermsPage = lazyRetry(() => import('./pages/TermsPage'));
const DisclaimerPage = lazyRetry(() => import('./pages/DisclaimerPage'));
const VenueTermsPage = lazyRetry(() => import('./pages/VenueTermsPage'));
const SafetyPage = lazyRetry(() => import('./pages/SafetyPage'));
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
const SetupNicknamePage = lazyRetry(() => import('./pages/auth/SetupNicknamePage'));
const DashboardPage = lazyRetry(() => import('./pages/admin/DashboardPage'));
const AdminPage = lazyRetry(() => import('./pages/admin/AdminPage'));
const AnalyticsPage = lazyRetry(() => import('./pages/admin/AnalyticsPage'));
const BillingPage = lazyRetry(() => import('./pages/admin/BillingPage'));
const OnboardingPage = lazyRetry(() => import('./pages/admin/OnboardingPage'));
const LaunchPage = lazyRetry(() => import('./pages/admin/LaunchPage'));
const VenueManagePage = lazyRetry(() => import('./pages/admin/VenueManagePage'));
const PostDetailPage = lazyRetry(() => import('./pages/community/PostDetailPage'));
const NightlifeGuidePage = lazyRetry(() => import('./pages/lead/NightlifeGuidePage'));
const LeadQuizPage = lazyRetry(() => import('./pages/lead/LeadQuizPage'));
const WeeklyHotPage = lazyRetry(() => import('./pages/lead/WeeklyHotPage'));
const WaitlistPage = lazyRetry(() => import('./pages/WaitlistPage'));
const MyReferralsPage = lazyRetry(() => import('./pages/my/MyReferralsPage'));
const MessagesPage = lazyRetry(() => import('./pages/MessagesPage'));
const NotFoundPage = lazyRetry(() => import('./pages/NotFoundPage'));

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          {/* Category listing */}
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/clubs/:region" element={<RegionalClubsPage />} />
          <Route path="/clubs/:region/:slug" element={<ClubDetailPage />} />
          <Route path="/nights" element={<NightsPage />} />
          <Route path="/nights/:slug" element={<NightDetailPage />} />
          <Route path="/lounges" element={<LoungesPage />} />
          <Route path="/lounges/:slug" element={<LoungeDetailPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:region" element={<RegionalRoomsPage />} />
          <Route path="/rooms/:region/:slug" element={<RoomDetailPage />} />
          <Route path="/yojeong" element={<YojeongPage />} />
          <Route path="/yojeong/:region" element={<RegionalYojeongPage />} />
          <Route path="/yojeong/:region/:slug" element={<YojeongDetailPage />} />
          <Route path="/hoppa" element={<HoppaPage />} />
          <Route path="/hoppa/:slug" element={<HoppaDetailPage />} />
          {/* Interactive */}
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/roulette" element={<RoulettePage />} />
          <Route path="/vs" element={<VSPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/price" element={<PricePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/search" element={<SearchPage />} />
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
          <Route path="/community/post/:id" element={<PostDetailPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          {/* Legal & Info */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/venue-terms" element={<VenueTermsPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/help" element={<HelpPage />} />
          {/* Business */}
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
          <Route path="/hidden" element={<HiddenPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/print/:slug" element={<PrintPage />} />
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/setup-nickname" element={<SetupNicknamePage />} />
          {/* Admin */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/launch" element={<LaunchPage />} />
          <Route path="/admin/venues" element={<VenueManagePage />} />
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
