import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import BackToTop from '@/components/layout/BackToTop';
import Toast from '@/components/ui/Toast';
import JsonLd from '@/components/seo/JsonLd';
import { useEngagementStore } from '@/lib/engagement-store';

/* ═══ 틱톡/넷플릭스/슬롯머신 심리학 기반 체류 엔진 (lazy) ═══ */
const SessionRewardBar = lazy(() => import('@/components/engagement/SessionRewardBar'));
const RewardAnimation = lazy(() => import('@/components/engagement/RewardAnimation'));
const DailyMissions = lazy(() => import('@/components/engagement/DailyMissions'));
const ComboMeter = lazy(() => import('@/components/engagement/ComboMeter'));

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '밤키',
  url: 'https://ilsanroom.pages.dev',
  logo: 'https://ilsanroom.pages.dev/favicon.ico',
  description: '전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '밤키',
  url: 'https://ilsanroom.pages.dev',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://ilsanroom.pages.dev/search?q={search_term_string}' },
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

/* ═══ [틱톡 심리학 #1] 세션 틱 — 매초 체류시간 추적 → 가변보상 트리거 ═══ */
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

/* ═══ [넷플릭스 심리학 #2] 일일 보상 자동 수령 — 매일 접속 습관 형성 ═══ */
function DailyRewardClaimer() {
  const claimDailyReward = useEngagementStore((s) => s.claimDailyReward);
  const dailyLoginRewardClaimed = useEngagementStore((s) => s.dailyLoginRewardClaimed);
  const claimWeeklyBonus = useEngagementStore((s) => s.claimWeeklyBonus);
  const streak = useEngagementStore((s) => s.streak);

  useEffect(() => {
    if (!dailyLoginRewardClaimed) {
      const timer = setTimeout(() => claimDailyReward(), 3000);
      return () => clearTimeout(timer);
    }
  }, [dailyLoginRewardClaimed, claimDailyReward]);

  useEffect(() => {
    if (streak >= 7) {
      const timer = setTimeout(() => claimWeeklyBonus(), 5000);
      return () => clearTimeout(timer);
    }
  }, [streak, claimWeeklyBonus]);

  return null;
}

/* ═══ [슬롯머신 심리학 #3] 미션 자동 완료 — 자이가르닉 효과 (미완 과제 집착) ═══ */
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
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />

      {/* ═══ 틱톡/넷플릭스/슬롯머신 체류 엔진 (비표시 트래커) ═══ */}
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

      {/* ═══ 체류시간 증가 UI 오버레이 (lazy, 팝업 아님) ═══
        SessionRewardBar: 하단바 — 1분/5분/10분/20분/30분/45분/60분/90분 마일스톤 보상
        RewardAnimation: 보상 획득 시 시각적 축하 효과
        DailyMissions: 플로팅 미션 버튼 — 6개 일일 미션 진행률
        ComboMeter: 연속 액션 콤보 카운터 (5→NICE, 10→ON FIRE, 20→INSANE)
      ═══ */}
      <Suspense fallback={null}>
        <SessionRewardBar />
        <RewardAnimation />
        <DailyMissions />
        <ComboMeter />
      </Suspense>
    </div>
  );
}
