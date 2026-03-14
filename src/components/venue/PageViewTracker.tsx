'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface PageViewTrackerProps {
  venueId: string;
  venueName: string;
  category: string;
  region: string;
}

export default function PageViewTracker({ venueId, venueName, category, region }: PageViewTrackerProps) {
  useEffect(() => {
    const client = createClient();
    if (client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).from('analytics_events').insert({
        venue_id: venueId,
        event_type: 'page_view',
        metadata: { venue_name: venueName, category, region },
      }).then(() => {}).catch(() => {});
    }
  }, [venueId, venueName, category, region]);

  return null;
}
