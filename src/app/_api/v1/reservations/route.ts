export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venue_id, user_id, reservation_date, party_size, special_requests } = body;

    if (!venue_id || !reservation_date) {
      return NextResponse.json(
        { error: 'venue_id and reservation_date are required' },
        { status: 400 }
      );
    }

    const reservationData = {
      id: crypto.randomUUID(),
      venue_id,
      user_id: user_id || null,
      reservation_date,
      party_size: party_size || 2,
      status: 'pending' as const,
      special_requests: special_requests || null,
      created_at: new Date().toISOString(),
    };

    const client = createServerClient();
    if (client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).from('reservations').insert(reservationData);
    }

    // Trigger KakaoTalk notification webhook (placeholder)
    console.log('[Webhook] Sending KakaoTalk notification to venue owner:', {
      type: 'new_reservation',
      venue_id,
      reservation_date,
      party_size: party_size || 2,
      timestamp: new Date().toISOString(),
    });

    // In production: call KakaoTalk Alimtalk API
    // await sendKakaoAlimtalk({
    //   templateId: 'RESERVATION_NEW',
    //   phone: ownerPhone,
    //   variables: { date: reservation_date, party_size, venue_name: venueName },
    // });

    return NextResponse.json({
      data: reservationData,
      message: '예약이 접수되었습니다. 업소에서 확인 후 연락드립니다.',
    });
  } catch {
    return NextResponse.json(
      { error: '예약 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venue_id');

  // Return mock reservation data
  const mockReservations = [
    { id: '1', venue_id: venueId, date: '2026-03-20', party_size: 4, status: 'confirmed' },
    { id: '2', venue_id: venueId, date: '2026-03-22', party_size: 8, status: 'pending' },
  ];

  return NextResponse.json({ data: mockReservations });
}
