import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@/lib/supabase';

export default function NaverCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      navigate('/login?error=naver_no_token');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      navigate('/login');
      return;
    }

    supabase.auth.verifyOtp({
      email,
      token,
      type: 'magiclink',
    }).then(({ data, error: otpError }) => {
      if (otpError || !data.session) {
        console.error('Naver OTP error:', otpError?.message);
        setError(otpError?.message || '세션 생성 실패');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      // 세션 생성 성공 → 홈으로
      navigate('/');
    });
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <p className="text-xs text-neon-text-muted">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
            <p className="text-sm text-neon-text-muted">네이버 로그인 처리 중...</p>
          </>
        )}
      </div>
    </div>
  );
}
