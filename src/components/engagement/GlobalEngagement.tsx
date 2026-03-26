import { useEffect, lazy, Suspense } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';

/**
 * GlobalEngagement — 모든 페이지에서 작동하는 체류시간 95분+ 시스템
 *
 * 틱톡 + 넷플릭스 + 슬롯머신 심리학 통합:
 *
 * 1. SessionRewardBar: 하단 레벨/포인트/진행률 바 (항상 보임)
 * 2. DailyMissions: 일일 미션 플로팅 버튼 (게임화)
 * 3. SocialProofToast: 실시간 활동 알림 (FOMO)
 * 4. ExitGuard: 이탈 방지 모달 (손실 회피)
 * 5. RewardAnimation: 보상 애니메이션 (도파민)
 * 6. ComboMeter: 연속 액션 콤보 (스트릭 심리)
 * 7. SlotMachinePopup: 가변 간격 랜덤 보상 (슬롯머신)
 * 8. DailyLoginReward: 일일 로그인 보상 (넷플릭스 웰컴백)
 * 9. ScrollDepthReward: 스크롤 깊이 보상 (미시 도파민)
 * 10. AutoNextSuggestion: 다음 콘텐츠 자동 추천 (넷플릭스 오토플레이)
 * 11. CuriosityGapTeaser: 호기심 갭 티저 (자이가르닉 효과)
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

export default function GlobalEngagement() {
  const initSession = useEngagementStore((s) => s.initSession);
  const tick = useEngagementStore((s) => s.tick);

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Run tick every second for session time tracking
  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Auto-complete missions when progress meets goals
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
    <Suspense fallback={null}>
      {/* Layer 1: Always-visible UI */}
      <SessionRewardBar />
      <DailyMissions />

      {/* Layer 2: Passive engagement (timers & scroll) */}
      <SocialProofToast />
      <ScrollDepthReward />
      <ComboMeter />

      {/* Layer 3: Triggered overlays */}
      <ExitGuard />
      <RewardAnimation />
      <AutoNextSuggestion />

      {/* Layer 4: Timed popups */}
      <SlotMachinePopup />
      <DailyLoginReward />
      <CuriosityGapTeaser />

      {/* Layer 5: TikTok-style feed launcher */}
      <TikTokLauncher />
    </Suspense>
  );
}
