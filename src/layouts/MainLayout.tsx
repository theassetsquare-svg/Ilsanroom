import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import BackToTop from '@/components/layout/BackToTop';
import Toast from '@/components/ui/Toast';
import JsonLd from '@/components/seo/JsonLd';
import { useEngagementStore } from '@/lib/engagement-store';

// Engagement overlays (lazy loaded)
const SessionRewardBar = lazy(() => import('@/components/engagement/SessionRewardBar'));
const SocialProofToast = lazy(() => import('@/components/engagement/SocialProofToast'));
const ExitGuard = lazy(() => import('@/components/engagement/ExitGuard'));
const RewardAnimation = lazy(() => import('@/components/engagement/RewardAnimation'));
const DailyMissions = lazy(() => import('@/components/engagement/DailyMissions'));
const ComboMeter = lazy(() => import('@/components/engagement/ComboMeter'));
const TikTokFeed = lazy(() => import('@/components/engagement/TikTokFeed'));

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '오늘밤어디',
  url: 'https://ilsanroom.pages.dev',
  logo: 'https://ilsanroom.pages.dev/favicon.ico',
  description: '솔직한 후기로 고르는 야간 문화 비교 서비스',
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '오늘밤어디',
  url: 'https://ilsanroom.pages.dev',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://ilsanroom.pages.dev/map?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Session ticker — runs every second to track dwell time */
function SessionTicker() {
  const tick = useEngagementStore((s) => s.tick);
  const initSession = useEngagementStore((s) => s.initSession);

  useEffect(() => {
    initSession();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick, initSession]);

  return null;
}

/** Daily login reward auto-claim */
function DailyRewardClaimer() {
  const claimDailyReward = useEngagementStore((s) => s.claimDailyReward);
  const dailyLoginRewardClaimed = useEngagementStore((s) => s.dailyLoginRewardClaimed);
  const claimWeeklyBonus = useEngagementStore((s) => s.claimWeeklyBonus);
  const streak = useEngagementStore((s) => s.streak);

  useEffect(() => {
    // Auto-claim daily reward after 3 seconds
    if (!dailyLoginRewardClaimed) {
      const timer = setTimeout(() => claimDailyReward(), 3000);
      return () => clearTimeout(timer);
    }
  }, [dailyLoginRewardClaimed, claimDailyReward]);

  useEffect(() => {
    // Auto-claim weekly bonus if eligible
    if (streak >= 7) {
      const timer = setTimeout(() => claimWeeklyBonus(), 5000);
      return () => clearTimeout(timer);
    }
  }, [streak, claimWeeklyBonus]);

  return null;
}

/** Auto-complete missions when progress meets goal */
function MissionAutoCompleter() {
  const getDailyMissions = useEngagementStore((s) => s.getDailyMissions);
  const completeMission = useEngagementStore((s) => s.completeMission);
  const venuesViewed = useEngagementStore((s) => s.venuesViewed);
  const votedBattles = useEngagementStore((s) => s.votedBattles);
  const quizCompleted = useEngagementStore((s) => s.quizCompleted);
  const rouletteUsed = useEngagementStore((s) => s.rouletteUsed);
  const searchCount = useEngagementStore((s) => s.searchCount);
  const shareCount = useEngagementStore((s) => s.shareCount);
  const likedVenues = useEngagementStore((s) => s.likedVenues);
  const dressCodeUsed = useEngagementStore((s) => s.dressCodeUsed);
  const totalSessionSeconds = useEngagementStore((s) => s.totalSessionSeconds);

  useEffect(() => {
    const missions = getDailyMissions();
    missions.forEach((m) => {
      if (!m.completed && m.progress >= m.goal) {
        completeMission(m.id);
      }
    });
  }, [venuesViewed, votedBattles, quizCompleted, rouletteUsed, searchCount, shareCount, likedVenues, dressCodeUsed, totalSessionSeconds, getDailyMissions, completeMission]);

  return null;
}

export default function MainLayout() {
  const [showTikTokFeed, setShowTikTokFeed] = useState(false);
  const [showFeedPrompt, setShowFeedPrompt] = useState(false);
  const totalSessionSeconds = useEngagementStore((s) => s.totalSessionSeconds);

  // Show TikTok feed prompt after 60 seconds of browsing
  useEffect(() => {
    if (totalSessionSeconds === 60 && !showFeedPrompt) {
      setShowFeedPrompt(true);
      // Auto-hide after 8 seconds
      setTimeout(() => setShowFeedPrompt(false), 8000);
    }
  }, [totalSessionSeconds, showFeedPrompt]);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <SessionTicker />
      <DailyRewardClaimer />
      <MissionAutoCompleter />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <Header />
      {/* 19세 안내 */}
      <div className="border-b border-neon-border bg-neon-surface">
        <p className="mx-auto max-w-[1200px] px-4 py-2 text-center text-xs text-neon-text-muted">
          본 사이트는 만 19세 이상 이용 가능합니다
        </p>
      </div>
      <main className="flex-1 pt-16 pb-20 md:pb-14">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <BackToTop />
      <Toast />

      {/* === ENGAGEMENT OVERLAYS === */}
      <Suspense fallback={null}>
        <SessionRewardBar />
        <SocialProofToast />
        <ExitGuard />
        <RewardAnimation />
        <DailyMissions />
        <ComboMeter />
      </Suspense>

      {/* TikTok Feed Prompt */}
      {showFeedPrompt && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[75] animate-bounce">
          <button
            onClick={() => { setShowTikTokFeed(true); setShowFeedPrompt(false); }}
            className="rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-purple-500/30 transition hover:scale-105 active:scale-95"
          >
            🔥 지금 뜨는 업소 둘러보기
          </button>
        </div>
      )}

      {/* TikTok Feed */}
      <Suspense fallback={null}>
        {showTikTokFeed && (
          <TikTokFeed isOpen={showTikTokFeed} onClose={() => setShowTikTokFeed(false)} />
        )}
      </Suspense>
    </div>
  );
}
