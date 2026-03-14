export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venue_id, event_type, metadata } = body;

    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    const client = createServerClient();
    if (client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).from('analytics_events').insert({
        venue_id: venue_id || null,
        event_type,
        metadata: metadata || {},
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venue_id');
  const eventType = searchParams.get('event_type');

  // Return mock analytics data
  const data = {
    total_views: Math.floor(Math.random() * 5000) + 1000,
    today_views: Math.floor(Math.random() * 200) + 50,
    unique_visitors: Math.floor(Math.random() * 3000) + 500,
    avg_time_on_page: '2m 34s',
    top_referrers: [
      { source: 'Google', visits: 450 },
      { source: 'Naver', visits: 380 },
      { source: 'Direct', visits: 220 },
      { source: 'KakaoTalk', visits: 150 },
    ],
  };

  return NextResponse.json({ data, venue_id: venueId, event_type: eventType });
}
