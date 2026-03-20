'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase OAuth callback — tokens are in URL hash, handled by Supabase SDK automatically
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-neon-text-muted">로그인 처리 중...</p>
    </div>
  );
}
