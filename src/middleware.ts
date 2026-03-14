import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware
 * - Rate limiting (100 req/min per IP, in-memory)
 * - Auth guard for /admin routes
 * - Bypasses static files and public routes
 */

// ─── Rate Limiter State ──────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in ms
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Periodic cleanup to prevent memory leak (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

// ─── Route Matchers ──────────────────────────────────────────────────

/** Routes that skip middleware entirely */
const PUBLIC_FILE_PATTERN = /\.(.*)$/; // files with extensions
const SKIP_PREFIXES = [
  "/_next",
  "/api/health",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/manifest.json",
];

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
];

function shouldSkip(pathname: string): boolean {
  if (PUBLIC_FILE_PATTERN.test(pathname)) return true;
  return SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

// ─── Middleware ───────────────────────────────────────────────────────

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1. Skip static files and infrastructure routes
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // 2. Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  cleanupExpiredEntries();

  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  } else {
    entry.count++;
  }

  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return new NextResponse(
      JSON.stringify({ error: "Too many requests", retryAfter }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  // Add rate limit info headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, RATE_LIMIT_MAX - entry.count))
  );
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(entry.resetAt / 1000))
  );

  // 3. Auth guard for /admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie =
      request.cookies.get("session")?.value ??
      request.cookies.get("__session")?.value;

    if (!sessionCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

// ─── Config ──────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
