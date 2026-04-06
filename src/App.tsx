import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';

/* ── Pages (lazy-loaded) ── */
const HomePage = lazy(() => import('./pages/HomePage'));
const ClubsPage = lazy(() => import('./pages/ClubsPage'));
const RegionalClubsPage = lazy(() => import('./pages/RegionalClubsPage'));
const ClubDetailPage = lazy(() => import('./pages/ClubDetailPage'));
const NightsPage = lazy(() => import('./pages/NightsPage'));
const NightDetailPage = lazy(() => import('./pages/NightDetailPage'));
const LoungesPage = lazy(() => import('./pages/LoungesPage'));
const LoungeDetailPage = lazy(() => import('./pages/LoungeDetailPage'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const RegionalRoomsPage = lazy(() => import('./pages/RegionalRoomsPage'));
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage'));
const YojeongPage = lazy(() => import('./pages/YojeongPage'));
const RegionalYojeongPage = lazy(() => import('./pages/RegionalYojeongPage'));
const YojeongDetailPage = lazy(() => import('./pages/YojeongDetailPage'));
const HoppaPage = lazy(() => import('./pages/HoppaPage'));
const HoppaDetailPage = lazy(() => import('./pages/HoppaDetailPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const RoulettePage = lazy(() => import('./pages/RoulettePage'));
const VSPage = lazy(() => import('./pages/VSPage'));
const RankingPage = lazy(() => import('./pages/RankingPage'));
const PricePage = lazy(() => import('./pages/PricePage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const MagazinePage = lazy(() => import('./pages/MagazinePage'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const QnAPage = lazy(() => import('./pages/community/QnAPage'));
const ReviewsPage = lazy(() => import('./pages/community/ReviewsPage'));
const TipsPage = lazy(() => import('./pages/community/TipsPage'));
const PartyPage = lazy(() => import('./pages/community/PartyPage'));
const FreePage = lazy(() => import('./pages/community/FreePage'));
const FashionPage = lazy(() => import('./pages/community/FashionPage'));
const GuidelinesPage = lazy(() => import('./pages/community/GuidelinesPage'));
const JogakPage = lazy(() => import('./pages/community/JogakPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const VenueTermsPage = lazy(() => import('./pages/VenueTermsPage'));
const SafetyPage = lazy(() => import('./pages/SafetyPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const ForBusinessPage = lazy(() => import('./pages/ForBusinessPage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const HiddenPage = lazy(() => import('./pages/HiddenPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const CaseStudiesPage = lazy(() => import('./pages/CaseStudiesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const PrintPage = lazy(() => import('./pages/PrintPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage'));
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage'));
const BillingPage = lazy(() => import('./pages/admin/BillingPage'));
const OnboardingPage = lazy(() => import('./pages/admin/OnboardingPage'));
const LaunchPage = lazy(() => import('./pages/admin/LaunchPage'));
const VenueManagePage = lazy(() => import('./pages/admin/VenueManagePage'));
const PostDetailPage = lazy(() => import('./pages/community/PostDetailPage'));
const NightlifeGuidePage = lazy(() => import('./pages/lead/NightlifeGuidePage'));
const LeadQuizPage = lazy(() => import('./pages/lead/LeadQuizPage'));
const WeeklyHotPage = lazy(() => import('./pages/lead/WeeklyHotPage'));
const WaitlistPage = lazy(() => import('./pages/WaitlistPage'));
const MyReferralsPage = lazy(() => import('./pages/my/MyReferralsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
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
          <Route path="/map" element={<MapPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/roulette" element={<RoulettePage />} />
          <Route path="/vs" element={<VSPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/price" element={<PricePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/magazine" element={<MagazinePage />} />
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
          {/* Legal & Info */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/venue-terms" element={<VenueTermsPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/help" element={<HelpPage />} />
          {/* Business */}
          <Route path="/for-business" element={<ForBusinessPage />} />
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
          {/* Admin */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
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
