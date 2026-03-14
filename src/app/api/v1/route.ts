import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.0.0",
    status: "ok",
    endpoints: [
      { method: "GET", path: "/api/v1", description: "API root" },
      { method: "GET", path: "/api/health", description: "Health check" },
      { method: "POST", path: "/api/webhooks", description: "Webhook receiver" },
    ],
  });
}
