import { lazy, Suspense } from 'react';

const StreakAndProgress = lazy(() => import('./StreakAndProgress'));
const CountdownUrgency = lazy(() => import('./CountdownUrgency'));
const InfiniteDiscoveryFeed = lazy(() => import('./InfiniteDiscoveryFeed'));

export default function EngagementSection() {
  return (
    <>
      <Suspense fallback={null}><StreakAndProgress /></Suspense>
      <Suspense fallback={null}><CountdownUrgency /></Suspense>
      <Suspense fallback={null}><InfiniteDiscoveryFeed /></Suspense>
    </>
  );
}
