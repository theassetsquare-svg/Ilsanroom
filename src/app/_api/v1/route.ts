export const dynamic = "force-static";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.0.0",
    status: "ok",
    endpoints: [
      { method: "GET", path: "/api/v1", description: "API root" },
      { method: "GET", path: "/api/health", description: "Health check" },
      { method: "GET", path: "/api/v1/venues", description: "List venues with filtering, search, and pagination" },
      { method: "GET", path: "/api/v1/venues/:id", description: "Get a single venue by slug or id" },
      { method: "GET", path: "/api/v1/reviews", description: "List reviews with optional venue filter" },
      { method: "POST", path: "/api/v1/reviews", description: "Create a review" },
      { method: "GET", path: "/api/v1/events", description: "List events with optional venue filter" },
      { method: "GET", path: "/api/v1/ranking", description: "Venue rankings by score" },
      { method: "GET", path: "/api/v1/subscriptions", description: "Get current subscription" },
      { method: "POST", path: "/api/v1/subscriptions", description: "Create/update subscription" },
      { method: "POST", path: "/api/webhooks", description: "Generic webhook receiver" },
      { method: "POST", path: "/api/webhooks/toss", description: "Toss Payments webhook" },
    ],
  });
}
