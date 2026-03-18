import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  // Supabase OAuth callback — the access_token & refresh_token
  // are passed as URL hash fragments, handled client-side by Supabase SDK.
  // This route simply redirects to the main page where the client
  // picks up the tokens from the hash.
  return NextResponse.redirect(`${origin}/`);
}
