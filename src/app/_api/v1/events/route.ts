export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { venues } from "@/data/venues";
import type { Event } from "@/types";

/** Generate mock events from static venue data. */
function generateMockEvents(): Event[] {
  const eventTemplates = [
    { suffix: "특별 공연", desc: "라이브 공연과 함께하는 특별한 밤을 즐겨보세요." },
    { suffix: "프로모션 이벤트", desc: "특별 할인과 이벤트가 준비되어 있습니다." },
    { suffix: "VIP 나이트", desc: "VIP 고객을 위한 프리미엄 이벤트입니다." },
    { suffix: "주말 파티", desc: "주말을 특별하게 보낼 수 있는 파티 이벤트입니다." },
  ];

  const events: Event[] = [];
  let eventId = 1;

  for (const venue of venues) {
    if (venue.status === "closed_or_unclear") continue;

    // Create 1-2 events per venue
    const count = venue.isPremium ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const template = eventTemplates[(eventId + i) % eventTemplates.length];
      const daysFromNow = (eventId * 3) % 60 - 15; // Mix of past and future
      const eventDate = new Date(Date.now() + daysFromNow * 86400000);

      events.push({
        id: `e-${String(eventId++).padStart(4, "0")}`,
        title: `${venue.nameKo} ${template.suffix}`,
        venue: venue.id,
        date: eventDate.toISOString().split("T")[0],
        description: template.desc,
        imageUrl: venue.imageUrl,
      });
    }
  }

  return events;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const venueId = searchParams.get("venue_id");
    const upcoming = searchParams.get("upcoming");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

    const supabase = createClient();

    let events: Event[];

    if (supabase) {
      // TODO: Replace with actual Supabase query when configured
      events = generateMockEvents();
    } else {
      events = generateMockEvents();
    }

    if (venueId) {
      events = events.filter((e) => e.venue === venueId);
    }

    if (upcoming === "true") {
      const today = new Date().toISOString().split("T")[0];
      events = events.filter((e) => e.date >= today);
    }

    // Sort by date ascending (nearest first)
    events.sort((a, b) => a.date.localeCompare(b.date));

    const total = events.length;
    const paginated = events.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API] GET /api/v1/events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
