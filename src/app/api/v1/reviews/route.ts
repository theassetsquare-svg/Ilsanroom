import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { venues } from "@/data/venues";

interface Review {
  id: string;
  venue_id: string;
  venue_name: string;
  rating: number;
  content: string;
  author: string;
  created_at: string;
}

/** Generate deterministic mock reviews from static venue data. */
function generateMockReviews(): Review[] {
  const mockPhrases = [
    "분위기가 좋고 서비스가 훌륭했습니다.",
    "친구들과 즐거운 시간을 보냈습니다. 재방문 의사 있습니다.",
    "깔끔한 시설과 친절한 직원들이 인상적이었습니다.",
    "음악 선곡이 좋았고 공간도 넓어서 편안했습니다.",
    "접근성이 좋고 주차도 편리해서 다시 방문하고 싶습니다.",
  ];

  const reviews: Review[] = [];
  let reviewId = 1;

  for (const venue of venues) {
    if (venue.status === "closed_or_unclear") continue;

    const count = Math.min(venue.reviewCount, 3); // Max 3 mock reviews per venue
    for (let i = 0; i < count; i++) {
      reviews.push({
        id: `r-${String(reviewId++).padStart(4, "0")}`,
        venue_id: venue.id,
        venue_name: venue.nameKo,
        rating: Math.max(3.5, venue.rating - 0.5 + Math.random()),
        content: mockPhrases[(reviewId + i) % mockPhrases.length],
        author: `사용자${reviewId}`,
        created_at: new Date(
          Date.now() - reviewId * 86400000,
        ).toISOString(),
      });
    }
  }

  return reviews;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const venueId = searchParams.get("venue_id");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

    const supabase = createClient();

    let reviews: Review[];

    if (supabase) {
      // TODO: Replace with actual Supabase query when configured
      reviews = generateMockReviews();
    } else {
      reviews = generateMockReviews();
    }

    if (venueId) {
      reviews = reviews.filter((r) => r.venue_id === venueId);
    }

    const total = reviews.length;
    const paginated = reviews.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API] GET /api/v1/reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.venue_id || !body.rating || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: venue_id, rating, content" },
        { status: 400 },
      );
    }

    const { venue_id, rating, content } = body;

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 },
      );
    }

    if (typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 },
      );
    }

    // Verify venue exists
    const venue = venues.find((v) => v.id === venue_id);
    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 },
      );
    }

    const supabase = createClient();

    if (supabase) {
      // TODO: Insert into Supabase when configured
    }

    // Return mock created review
    const review: Review = {
      id: `r-${Date.now()}`,
      venue_id,
      venue_name: venue.nameKo,
      rating,
      content: content.trim(),
      author: "Anonymous",
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/v1/reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
