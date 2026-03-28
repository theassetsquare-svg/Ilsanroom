import { lazy, Suspense } from 'react';

const StreakAndProgress = lazy(() => import('./StreakAndProgress'));
const CountdownUrgency = lazy(() => import('./CountdownUrgency'));
const InfiniteDiscoveryFeed = lazy(() => import('./InfiniteDiscoveryFeed'));
const NightFortune = lazy(() => import('./NightFortune'));
const NearbyFood = lazy(() => import('./NearbyFood'));

export default function EngagementSection() {
  return (
    <>
      <Suspense fallback={null}><StreakAndProgress /></Suspense>
      <Suspense fallback={null}><NightFortune /></Suspense>
      <Suspense fallback={null}><CountdownUrgency /></Suspense>
      <Suspense fallback={null}><InfiniteDiscoveryFeed /></Suspense>
      <Suspense fallback={null}><NearbyFood /></Suspense>
    </>
  );
}
