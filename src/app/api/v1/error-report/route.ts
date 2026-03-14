import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, level, tags, extra, timestamp } = body;

    // Log error (in production: forward to Sentry API)
    console.error(`[Error Report] [${level}] ${message}`, {
      tags,
      extra,
      timestamp,
      ip: request.headers.get('x-forwarded-for'),
    });

    // In production with SENTRY_DSN:
    // const dsn = process.env.SENTRY_DSN;
    // await fetch(dsn, { method: 'POST', body: JSON.stringify(body) });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Failed to process error report' }, { status: 500 });
  }
}
