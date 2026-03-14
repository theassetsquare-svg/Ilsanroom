import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { venues } from "@/data/venues";

interface RankingEntry {
  rank: number;
  venue: {
    id: string;
    slug: string;
    name: string;
    nameKo: string;
    category: string;
    region: string;
    regionKo: string;
    imageUrl: string;
    rating: number;
    reviewCount: number;
    isPremium: boolean;
  };
  score: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const period = searchParams.get("period") ?? "month";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

    const supabase = createClient();

    // Use static data for ranking (Supabase or fallback)
    let filtered = venues.filter((v) => v.status !== "closed_or_unclear");

    if (category) {
      filtered = filtered.filter((v) => v.category === category);
    }

    if (region) {
      filtered = filtered.filter(
        (v) => v.region.toLowerCase() === region.toLowerCase() || v.regionKo === region,
      );
    }

    // Compute score: rating * reviewCount, with period-based weighting
    const periodMultiplier = period === "week" ? 0.5 : period === "all" ? 1.5 : 1.0;

    const scored = filtered
      .map((v) => ({
        venue: {
          id: v.id,
          slug: v.slug,
          name: v.name,
          nameKo: v.nameKo,
          category: v.category,
          region: v.region,
          regionKo: v.regionKo,
          imageUrl: v.imageUrl,
          rating: v.rating,
          reviewCount: v.reviewCount,
          isPremium: v.isPremium,
        },
        score: Math.round(v.rating * v.reviewCount * periodMultiplier * 100) / 100,
      }))
      .sort((a, b) => b.score - a.score);

    const total = scored.length;
    const paginated = scored.slice(offset, offset + limit);

    const rankings: RankingEntry[] = paginated.map((entry, i) => ({
      rank: offset + i + 1,
      venue: entry.venue,
      score: entry.score,
    }));

    // Log Supabase status for debugging
    if (supabase) {
      // TODO: Use actual time-based scoring from Supabase analytics
    }

    return NextResponse.json({
      data: rankings,
      total,
      limit,
      offset,
      period,
    });
  } catch (error) {
    console.error("[API] GET /api/v1/ranking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
