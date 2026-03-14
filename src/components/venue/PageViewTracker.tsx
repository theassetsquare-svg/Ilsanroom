'use client';

import { useEffect } from 'react';

interface PageViewTrackerProps {
  venueId: string;
  venueName: string;
  category: string;
  region: string;
}

export default function PageViewTracker({ venueId, venueName, category, region }: PageViewTrackerProps) {
  useEffect(() => {
    // Track page view via API
    fetch('/api/v1/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venue_id: venueId,
        event_type: 'page_view',
        metadata: { venue_name: venueName, category, region },
      }),
    }).catch(() => {
      // Silent fail - analytics should never block UX
    });
  }, [venueId, venueName, category, region]);

  return null;
}
