export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

interface Subscription {
  id: string;
  user_id: string;
  venue_id: string | null;
  plan: "free" | "basic" | "premium" | "enterprise";
  status: "active" | "cancelled" | "expired" | "pending";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: "sub-placeholder",
  user_id: "anonymous",
  venue_id: null,
  plan: "free",
  status: "active",
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  created_at: new Date().toISOString(),
};

export async function GET() {
  try {
    const supabase = createClient();

    if (supabase) {
      // TODO: Fetch actual subscription from Supabase using auth context
    }

    return NextResponse.json({ data: DEFAULT_SUBSCRIPTION });
  } catch (error) {
    console.error("[API] GET /api/v1/subscriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.plan) {
      return NextResponse.json(
        { error: "Missing required field: plan" },
        { status: 400 },
      );
    }

    const validPlans = ["free", "basic", "premium", "enterprise"];
    if (!validPlans.includes(body.plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createClient();

    if (supabase) {
      // TODO: Create/update subscription in Supabase
    }

    const subscription: Subscription = {
      id: `sub-${Date.now()}`,
      user_id: "anonymous",
      venue_id: body.venue_id ?? null,
      plan: body.plan,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ data: subscription }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/v1/subscriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
