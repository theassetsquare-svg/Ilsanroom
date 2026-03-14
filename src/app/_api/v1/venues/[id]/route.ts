export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { venues } from "@/data/venues";

export function generateStaticParams() {
  return venues.filter(v => v.status !== 'closed_or_unclear').map(v => ({ id: v.slug }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = createClient();

    let venue;

    if (supabase) {
      // TODO: Replace with actual Supabase query when configured
      venue = venues.find((v) => v.slug === id || v.id === id);
    } else {
      venue = venues.find((v) => v.slug === id || v.id === id);
    }

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 },
      );
    }

    if (venue.status === "closed_or_unclear") {
      return NextResponse.json(
        { error: "Venue is no longer available" },
        { status: 410 },
      );
    }

    return NextResponse.json({ data: venue });
  } catch (error) {
    console.error("[API] GET /api/v1/venues/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
