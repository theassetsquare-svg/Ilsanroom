import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

function signInWith(provider: 'kakao' | 'google') {
  const supabase = createClient();
  if (!supabase) {
    alert('Supabase 연결이 설정되지 않았습니다. 관리자에게 문의해주세요.');
    return;
  }
  supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
    },
  });
}

export default function LoginPage() {
  useDocumentMeta('로그인 — 카카오·이메일로 3초 시작 | 놀쿨', '카카오 탭 한 번이면 끝. 3초 후에 글 쓰고 후기 남긴다.');
  const [loading, setLoading] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const handleLogin = (provider: 'kakao' | 'google') => {
    setLoading(provider);
    signInWith(provider);
    setTimeout(() => setLoading(null), 3000);
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setEmailError('이메일과 비밀번호를 입력해주세요');
      return;
    }
    if (password.length < 6) {
      setEmailError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setEmailError('Supabase 연결 실패');
      return;
    }

    setLoading('email');
    setEmailError('');
    setEmailSuccess('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
        },
      });
      setLoading(null);
      if (error) {
        setEmailError(error.message);
      } else {
        setEmailSuccess('인증 메일을 발송했습니다. 메일함을 확인해주세요.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(null);
      if (error) {
        setEmailError(error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 일치하지 않습니다' : error.message);
      } else {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold text-neon-text">
        {mode === 'login' ? '로그인' : '회원가입'}
      </h1>
      <p className="mb-8 text-center text-sm text-neon-text-muted">
        {mode === 'login' ? '소셜 계정 또는 이메일로 간편하게 시작하세요' : '이메일로 새 계정을 만드세요'}
      </p>

      <div className="space-y-3">
        {/* Kakao */}
        <button
          onClick={() => handleLogin('kakao')}
          disabled={loading === 'kakao'}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] py-3.5 text-sm font-bold text-neutral-900 transition hover:bg-[#FDD700] disabled:opacity-60"
          style={{ minHeight: '48px' }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#3C1E1E">
            <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6-.14.53-.92 3.31-.95 3.53 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.42 4.28-2.83.55.08 1.11.12 1.69.12 5.52 0 10-3.58 10-7.97C22 6.58 17.52 3 12 3z"/>
          </svg>
          {loading === 'kakao' ? '연결 중...' : '카카오로 시작하기'}
        </button>

        {/* Google */}
        <button
          onClick={() => handleLogin('google')}
          disabled={loading === 'google'}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-neon-border bg-white py-3.5 text-sm font-bold text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-60"
          style={{ minHeight: '48px' }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading === 'google' ? '연결 중...' : 'Google로 시작하기'}
        </button>
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-neon-border" />
        <span className="text-xs text-neon-text-muted">또는 이메일로</span>
        <div className="h-px flex-1 bg-neon-border" />
      </div>

      {/* Email auth */}
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary transition"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary transition"
        />

        {emailError && <p className="text-sm text-red-500">{emailError}</p>}
        {emailSuccess && <p className="text-sm text-green-600">{emailSuccess}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading === 'email'}
          className="flex w-full items-center justify-center rounded-xl bg-neon-primary py-3.5 text-sm font-bold text-white transition hover:bg-neon-primary-light disabled:opacity-60"
        >
          {loading === 'email' ? '처리 중...' : mode === 'login' ? '이메일로 로그인' : '회원가입'}
        </button>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setEmailError(''); setEmailSuccess(''); }}
          className="w-full text-center text-sm text-neon-text-muted hover:text-neon-primary transition"
        >
          {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-neon-text-muted">
        로그인하면 놀쿨의{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-neon-primary hover:underline">이용약관</a> 및{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-primary hover:underline">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}
