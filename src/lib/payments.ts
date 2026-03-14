/**
 * 토스페이먼츠 결제 모듈
 * Toss Payments integration layer
 */

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? "";
const TOSS_API_BASE = "https://api.tosspayments.com/v1";

// ─── Types ───────────────────────────────────────────────────────────

export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  currency?: "KRW" | "USD";
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  method?: "카드" | "가상계좌" | "간편결제" | "휴대폰" | "계좌이체";
  successUrl: string;
  failUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status:
    | "READY"
    | "IN_PROGRESS"
    | "WAITING_FOR_DEPOSIT"
    | "DONE"
    | "CANCELED"
    | "PARTIAL_CANCELED"
    | "ABORTED"
    | "EXPIRED";
  amount: number;
  currency: string;
  method: string;
  approvedAt: string | null;
  receiptUrl: string | null;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
  };
  cancels?: PaymentCancel[];
}

export interface PaymentCancel {
  cancelAmount: number;
  cancelReason: string;
  canceledAt: string;
  refundStatus: "NONE" | "PENDING" | "FAILED" | "PARTIAL_REFUNDED" | "REFUNDED";
}

export interface PaymentError {
  code: string;
  message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function generatePaymentKey(): string {
  return `tviva${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")}`;
}

// ─── Functions ───────────────────────────────────────────────────────

/**
 * 결제 요청 생성
 * Creates a new payment request and returns a checkout URL + payment key.
 */
export async function createPayment(
  request: PaymentRequest
): Promise<PaymentResult> {
  // TODO: Replace with actual Toss Payments API call
  // POST ${TOSS_API_BASE}/payments
  // Headers: Authorization: ${authHeader()}

  const paymentKey = generatePaymentKey();

  const result: PaymentResult = {
    paymentKey,
    orderId: request.orderId,
    orderName: request.orderName,
    status: "READY",
    amount: request.amount,
    currency: request.currency ?? "KRW",
    method: request.method ?? "카드",
    approvedAt: null,
    receiptUrl: null,
  };

  console.log(
    `[payments] createPayment: orderId=${request.orderId}, amount=${request.amount}, clientKey=${TOSS_CLIENT_KEY.slice(0, 8)}...`
  );

  return result;
}

/**
 * 결제 승인 (confirm)
 * Called after user completes checkout on the Toss widget.
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  // TODO: Replace with actual Toss Payments API call
  // POST ${TOSS_API_BASE}/payments/confirm
  // Body: { paymentKey, orderId, amount }
  // Headers: Authorization: ${authHeader()}

  const result: PaymentResult = {
    paymentKey,
    orderId,
    orderName: "주문 확인",
    status: "DONE",
    amount,
    currency: "KRW",
    method: "카드",
    approvedAt: new Date().toISOString(),
    receiptUrl: `https://dashboard.tosspayments.com/receipt/mock/${paymentKey}`,
    card: {
      company: "삼성카드",
      number: "4321-****-****-1234",
      installmentPlanMonths: 0,
      isInterestFree: false,
    },
  };

  console.log(
    `[payments] confirmPayment: paymentKey=${paymentKey}, orderId=${orderId}, amount=${amount}`
  );

  return result;
}

/**
 * 결제 취소 (전액 또는 부분)
 */
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number
): Promise<PaymentResult> {
  // TODO: Replace with actual Toss Payments API call
  // POST ${TOSS_API_BASE}/payments/${paymentKey}/cancel
  // Body: { cancelReason, cancelAmount }
  // Headers: Authorization: ${authHeader()}

  const now = new Date().toISOString();
  const amount = cancelAmount ?? 50000;

  const result: PaymentResult = {
    paymentKey,
    orderId: `order_${Date.now()}`,
    orderName: "취소된 주문",
    status: cancelAmount ? "PARTIAL_CANCELED" : "CANCELED",
    amount,
    currency: "KRW",
    method: "카드",
    approvedAt: now,
    receiptUrl: null,
    cancels: [
      {
        cancelAmount: amount,
        cancelReason,
        canceledAt: now,
        refundStatus: "REFUNDED",
      },
    ],
  };

  console.log(
    `[payments] cancelPayment: paymentKey=${paymentKey}, reason="${cancelReason}", amount=${amount}`
  );

  return result;
}
