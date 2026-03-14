import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  console.log("[Webhook received]", {
    timestamp: new Date().toISOString(),
    body,
  });

  return NextResponse.json(
    { received: true, timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
