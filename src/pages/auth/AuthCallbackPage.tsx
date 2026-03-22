import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      navigate('/');
      return;
    }

    // Supabase handles the token exchange from the URL hash automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      } else {
        // Wait a moment for the hash to be processed
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            navigate(s ? '/' : '/login');
          });
        }, 1000);
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" />
        <p className="text-sm text-neon-text-muted">로그인 처리 중...</p>
      </div>
    </div>
  );
}
