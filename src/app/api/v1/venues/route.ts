import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { venues } from "@/data/venues";
import type { Venue } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const premium = searchParams.get("premium");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);
    const sort = searchParams.get("sort") ?? "rating";

    const supabase = createClient();

    let results: Venue[];

    if (supabase) {
      // TODO: Replace with actual Supabase query when configured
      results = venues;
    } else {
      results = venues;
    }

    // Filter out closed venues
    results = results.filter((v) => v.status !== "closed_or_unclear");

    // Apply filters
    if (category) {
      results = results.filter((v) => v.category === category);
    }

    if (region) {
      results = results.filter(
        (v) => v.region.toLowerCase() === region.toLowerCase() || v.regionKo === region,
      );
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.nameKo.includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.shortDescription.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (premium === "true") {
      results = results.filter((v) => v.isPremium);
    }

    // Sort
    switch (sort) {
      case "reviewCount":
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "newest":
        // Static data has no createdAt; fall back to id order (higher id = newer)
        results.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case "rating":
      default:
        results.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
    }

    const total = results.length;

    // Paginate
    const paginated = results.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API] GET /api/v1/venues error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
