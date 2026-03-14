/**
 * 분석 추적 모듈
 * Analytics tracking utilities (GA4 + custom events)
 */

// ─── Types ───────────────────────────────────────────────────────────

interface GtagEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

interface ConversionParams {
  transactionId?: string;
  value?: number;
  currency?: string;
  items?: ConversionItem[];
}

interface ConversionItem {
  itemId: string;
  itemName: string;
  category?: string;
  price?: number;
  quantity?: number;
}

// Extend Window to include gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ─── Config ──────────────────────────────────────────────────────────

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "";

// ─── Helpers ─────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function hasGtag(): boolean {
  return isBrowser() && typeof window.gtag === "function";
}

// ─── Functions ───────────────────────────────────────────────────────

/**
 * 페이지뷰 추적
 * Tracks a page view. Called automatically by Next.js router events
 * or manually for virtual page views.
 */
export function trackPageView(url: string, title?: string): void {
  if (!isBrowser()) return;

  if (hasGtag() && GA4_ID) {
    window.gtag!("config", GA4_ID, {
      page_path: url,
      page_title: title,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] pageview: ${url}${title ? ` — ${title}` : ""}`);
  }
}

/**
 * 커스텀 이벤트 추적
 * Sends a custom event to GA4.
 *
 * @example
 * trackEvent({ action: "click_venue", category: "engagement", label: "club-race" })
 */
export function trackEvent(event: GtagEvent): void {
  if (!isBrowser()) return;

  if (hasGtag()) {
    const { action, category, label, value, ...rest } = event;
    window.gtag!("event", action, {
      event_category: category,
      event_label: label,
      value,
      ...rest,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] event:`, event);
  }
}

/**
 * 전환 추적
 * Tracks a conversion event (purchase, signup, etc.).
 */
export function trackConversion(
  conversionName: string,
  params?: ConversionParams
): void {
  if (!isBrowser()) return;

  if (hasGtag()) {
    window.gtag!("event", conversionName, {
      send_to: GA4_ID,
      transaction_id: params?.transactionId,
      value: params?.value,
      currency: params?.currency ?? "KRW",
      items: params?.items?.map((item) => ({
        item_id: item.itemId,
        item_name: item.itemName,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity ?? 1,
      })),
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] conversion: ${conversionName}`, params);
  }
}
