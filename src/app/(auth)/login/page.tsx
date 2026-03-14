'use client';

import { createClient } from '@/lib/supabase';

function signInWith(provider: 'kakao' | 'google') {
  const supabase = createClient();
  if (!supabase) return;
  supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://ilsanroom.pages.dev/',
    },
  });
}

export default function LoginPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-neon-text">로그인</h1>
      <p className="mb-8 text-center text-sm text-neon-text-muted">소셜 계정으로 간편하게 시작하세요</p>

      <div className="space-y-3">
        <button
          onClick={() => signInWith('kakao')}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] py-3.5 text-sm font-bold text-neutral-900 transition hover:bg-[#FDD700]"
          style={{ minHeight: '48px' }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#3C1E1E">
            <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6-.14.53-.92 3.31-.95 3.53 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.42 4.28-2.83.55.08 1.11.12 1.69.12 5.52 0 10-3.58 10-7.97C22 6.58 17.52 3 12 3z"/>
          </svg>
          카카오로 시작하기
        </button>

        <button
          onClick={() => signInWith('google')}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-neon-border bg-white py-3.5 text-sm font-bold text-neutral-800 transition hover:bg-neutral-100"
          style={{ minHeight: '48px' }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 시작하기
        </button>

        <button
          onClick={() => {
            // 네이버는 Supabase에서 custom OIDC로 설정 필요
            // 현재는 카카오/구글 우선. 네이버 설정 완료 후 활성화.
            const supabase = createClient();
            if (!supabase) return;
            supabase.auth.signInWithOAuth({
              provider: 'kakao', // 네이버 설정 완료 시 변경
              options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://ilsanroom.pages.dev/' },
            });
          }}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#03C75A] py-3.5 text-sm font-bold text-white transition hover:bg-[#02B550]"
          style={{ minHeight: '48px' }}
        >
          <span className="text-lg font-black">N</span>
          네이버로 시작하기
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-neon-text-muted">
        로그인하면 일산룸포털의{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-neon-primary-light hover:underline">이용약관</a> 및{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-primary-light hover:underline">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}
