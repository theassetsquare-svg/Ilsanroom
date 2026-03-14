export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { processSubscriptionPayment, cancelPayment, PLAN_PRICES, PLAN_NAMES, generateOrderId } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, plan, customerKey, billingKey, paymentKey, reason } = body;

    switch (action) {
      case 'subscribe': {
        if (!plan || !customerKey) {
          return NextResponse.json({ error: 'plan and customerKey required' }, { status: 400 });
        }
        const amount = PLAN_PRICES[plan];
        if (amount === undefined) {
          return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }
        if (amount === 0) {
          return NextResponse.json({ data: { plan, status: 'active', amount: 0 } });
        }
        const orderId = generateOrderId(plan);
        const result = await processSubscriptionPayment({
          customerKey,
          billingKey,
          planId: plan,
          amount,
          orderId,
          orderName: `NEON ${PLAN_NAMES[plan]} 월간 구독`,
        });
        return NextResponse.json({ data: result });
      }
      case 'cancel': {
        if (!paymentKey || !reason) {
          return NextResponse.json({ error: 'paymentKey and reason required' }, { status: 400 });
        }
        const cancelResult = await cancelPayment(paymentKey, reason);
        return NextResponse.json({ data: cancelResult });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
