import { useEffect, lazy, Suspense, Component, type ReactNode } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';

/**
 * GlobalEngagement — 모든 페이지에서 작동하는 체류시간 95분+ 시스템
 *
 * 각 서브컴포넌트를 개별 ErrorBoundary로 감싸서
 * 하나가 에러나도 다른 컴포넌트는 정상 작동
 */

const SessionRewardBar = lazy(() => import('./SessionRewardBar'));
const DailyMissions = lazy(() => import('./DailyMissions'));
const SocialProofToast = lazy(() => import('./SocialProofToast'));
const ExitGuard = lazy(() => import('./ExitGuard'));
const RewardAnimation = lazy(() => import('./RewardAnimation'));
const ComboMeter = lazy(() => import('./ComboMeter'));
const SlotMachinePopup = lazy(() => import('./SlotMachinePopup'));
const DailyLoginReward = lazy(() => import('./DailyLoginReward'));
const ScrollDepthReward = lazy(() => import('./ScrollDepthReward'));
const AutoNextSuggestion = lazy(() => import('./AutoNextSuggestion'));
const CuriosityGapTeaser = lazy(() => import('./CuriosityGapTeaser'));
const TikTokLauncher = lazy(() => import('./TikTokLauncher'));

/** Silent ErrorBoundary — 에러 시 아무것도 안 보여줌 (빈 화면 방지) */
class Silent extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: Error) { console.error('[Engagement]', e.message); }
  render() { return this.state.err ? null : this.props.children; }
}

/** 개별 래핑: Suspense + ErrorBoundary */
function Safe({ children }: { children: ReactNode }) {
  return (
    <Silent>
      <Suspense fallback={null}>{children}</Suspense>
    </Silent>
  );
}

export default function GlobalEngagement() {
  const initSession = useEngagementStore((s) => s.initSession);
  const tick = useEngagementStore((s) => s.tick);

  useEffect(() => { initSession(); }, [initSession]);

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    const checkMissions = () => {
      const store = useEngagementStore.getState();
      const missions = store.getDailyMissions();
      for (const m of missions) {
        if (!m.completed && m.progress >= m.goal) {
          store.completeMission(m.id);
        }
      }
    };
    const interval = setInterval(checkMissions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Layer 1: Always-visible UI */}
      <Safe><SessionRewardBar /></Safe>
      <Safe><DailyMissions /></Safe>

      {/* Layer 2: Passive engagement */}
      <Safe><SocialProofToast /></Safe>
      <Safe><ScrollDepthReward /></Safe>
      <Safe><ComboMeter /></Safe>

      {/* Layer 3: Triggered overlays */}
      <Safe><ExitGuard /></Safe>
      <Safe><RewardAnimation /></Safe>
      <Safe><AutoNextSuggestion /></Safe>

      {/* Layer 4: Timed popups */}
      <Safe><SlotMachinePopup /></Safe>
      <Safe><DailyLoginReward /></Safe>
      <Safe><CuriosityGapTeaser /></Safe>

      {/* Layer 5: TikTok-style feed */}
      <Safe><TikTokLauncher /></Safe>
    </>
  );
}
