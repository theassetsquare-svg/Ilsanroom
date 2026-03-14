import { NextRequest, NextResponse } from "next/server";

interface TossWebhookPayload {
  eventType?: string;
  orderId?: string;
  paymentKey?: string;
  status?: string;
  amount?: number;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    const body: TossWebhookPayload | null = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!body.eventType) {
      return NextResponse.json(
        { error: "Missing required field: eventType" },
        { status: 400 },
      );
    }

    // Log the webhook event
    console.log("[Webhook:Toss] Received event:", {
      eventType: body.eventType,
      orderId: body.orderId,
      paymentKey: body.paymentKey,
      status: body.status,
      amount: body.amount,
      timestamp: new Date().toISOString(),
    });

    // TODO: Process webhook event based on eventType
    // - PAYMENT_STATUS_CHANGED: Update payment status in DB
    // - PAYOUT_STATUS_CHANGED: Update payout status in DB
    // - DEPOSIT_CALLBACK: Handle virtual account deposit

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Webhook:Toss] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
