// Toss Payments integration for 오늘밤어디 SaaS

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const API_URL = 'https://api.tosspayments.com/v1';

export interface SubscriptionPayment {
  customerKey: string;
  billingKey?: string;
  planId: string;
  amount: number;
  orderId: string;
  orderName: string;
}

export interface PaymentResult {
  success: boolean;
  paymentKey?: string;
  orderId: string;
  amount: number;
  status: string;
  error?: string;
}

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  basic: 99000,
  pro: 299000,
  premium: 599000,
};

export const PLAN_NAMES: Record<string, string> = {
  free: '무료',
  basic: '베이직',
  pro: '프로',
  premium: '프리미엄',
};

// Request billing key for subscription
export async function requestBillingKey(customerKey: string): Promise<{ billingKey: string } | null> {
  if (!TOSS_SECRET_KEY) {
    console.warn('[Payments] TOSS_SECRET_KEY not configured');
    return { billingKey: `mock_billing_${customerKey}_${Date.now()}` };
  }

  try {
    const response = await fetch(`${API_URL}/billing/authorizations/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerKey }),
    });
    return response.json();
  } catch (error) {
    console.error('[Payments] Billing key request failed:', error);
    return null;
  }
}

// Process subscription payment
export async function processSubscriptionPayment(payment: SubscriptionPayment): Promise<PaymentResult> {
  if (!TOSS_SECRET_KEY) {
    return {
      success: true,
      paymentKey: `mock_payment_${Date.now()}`,
      orderId: payment.orderId,
      amount: payment.amount,
      status: 'DONE',
    };
  }

  try {
    const response = await fetch(`${API_URL}/billing/${payment.billingKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey: payment.customerKey,
        amount: payment.amount,
        orderId: payment.orderId,
        orderName: payment.orderName,
      }),
    });
    const data = await response.json();
    return {
      success: data.status === 'DONE',
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      amount: data.totalAmount,
      status: data.status,
    };
  } catch (error) {
    return {
      success: false,
      orderId: payment.orderId,
      amount: payment.amount,
      status: 'FAILED',
      error: String(error),
    };
  }
}

// Cancel payment
export async function cancelPayment(paymentKey: string, reason: string): Promise<{ success: boolean }> {
  if (!TOSS_SECRET_KEY) {
    return { success: true };
  }

  try {
    const response = await fetch(`${API_URL}/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason: reason }),
    });
    const data = await response.json();
    return { success: data.status === 'CANCELED' };
  } catch {
    return { success: false };
  }
}

// Retry failed payment
export async function retryPayment(payment: SubscriptionPayment, maxRetries = 3): Promise<PaymentResult> {
  let lastResult: PaymentResult = {
    success: false,
    orderId: payment.orderId,
    amount: payment.amount,
    status: 'FAILED',
  };

  for (let i = 0; i < maxRetries; i++) {
    lastResult = await processSubscriptionPayment(payment);
    if (lastResult.success) return lastResult;
    // Wait before retry (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
  }

  return lastResult;
}

// Generate order ID
export function generateOrderId(planId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `NEON_${planId}_${timestamp}_${random}`.toUpperCase();
}
