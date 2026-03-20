

import { lazy, Suspense } from 'react';

const StreakAndProgress = dynamic(() => import('./StreakAndProgress'), { ssr: false });
const CountdownUrgency = dynamic(() => import('./CountdownUrgency'), { ssr: false });
const InfiniteDiscoveryFeed = dynamic(() => import('./InfiniteDiscoveryFeed'), { ssr: false });

export default function EngagementSection() {
  return (
    <>
      <StreakAndProgress />
      <CountdownUrgency />
      <InfiniteDiscoveryFeed />
    </>
  );
}
