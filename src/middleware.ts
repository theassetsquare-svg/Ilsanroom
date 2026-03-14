import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Tier-based rate limits (requests per minute)
const RATE_LIMITS: Record<string, number> = {
  free: 100,
  basic: 300,
  pro: 1000,
  premium: 5000,
};

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
let lastCleanup = Date.now();
function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

function getRateLimit(request: NextRequest): number {
  const tierCookie = request.cookies.get("user_tier")?.value;
  const tier = tierCookie && RATE_LIMITS[tierCookie] ? tierCookie : "free";
  return RATE_LIMITS[tier];
}

function checkRateLimit(ip: string, limit: number): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupStore();
  const now = Date.now();
  const key = ip;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + 60000;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Public routes that don't require auth
const publicPaths = [
  "/",
  "/clubs",
  "/nights",
  "/lounges",
  "/rooms",
  "/yojeong",
  "/hoppa",
  "/collatek",
  "/community",
  "/events",
  "/ranking",
  "/map",
  "/magazine",
  "/quiz",
  "/compare",
  "/price",
  "/safety",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/disclaimer",
  "/venue-terms",
  "/help",
  "/status",
  "/pricing",
  "/for-business",
  "/case-studies",
  "/demo",
  "/referral",
  "/api/health",
  "/api/v1",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const limit = getRateLimit(request);
    const { allowed, remaining, resetAt } = checkRateLimit(ip, limit);

    if (!allowed) {
      return NextResponse.json(
        { error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(resetAt / 1000).toString(),
            "Retry-After": Math.ceil((resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());
    return response;
  }

  // Auth check for admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/billing") || pathname.startsWith("/analytics") || pathname.startsWith("/onboarding")) {
    const session = request.cookies.get("session")?.value || request.cookies.get("__session")?.value;
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
