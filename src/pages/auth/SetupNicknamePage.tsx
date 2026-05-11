import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function SetupNicknamePage() {
  useDocumentMeta('닉네임 설정 — 커뮤니티에서 사용할 이름 정하기', '가입 후 첫 단계. 커뮤니티에서 사용할 닉네임을 2~12자로 정해주세요. 한글·영문·숫자 가능, 나중에 변경할 수 있습니다.');
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { navigate('/login'); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return; }
      // If already has nickname, go home
      const meta = session.user?.user_metadata;
      if (meta?.nickname && meta.nickname.trim().length > 0) {
        navigate('/');
        return;
      }
      // Pre-fill with name from OAuth if available
      const name = meta?.full_name || meta?.name || '';
      if (name) setNickname(name.slice(0, 12));
      setChecking(false);
    });
  }, [navigate]);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      setError('닉네임은 2~12자로 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    if (!supabase) { setError('연결 실패'); setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login'); return; }

    // Check duplicate nickname
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', trimmed)
        .neq('id', session.user.id)
        .limit(1);
      if (existing && existing.length > 0) {
        setError('이미 사용 중인 닉네임입니다');
        setLoading(false);
        return;
      }
    } catch {}

    // Save to user_metadata
    const { error: metaError } = await supabase.auth.updateUser({
      data: { nickname: trimmed },
    });
    if (metaError) {
      setError('저장 실패: ' + metaError.message);
      setLoading(false);
      return;
    }

    // Sync to users table
    try {
      await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email || '',
          nickname: trimmed,
          avatar_url: session.user.user_metadata?.avatar_url || null,
        }, { onConflict: 'id' });
    } catch {}

    navigate('/');
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F0FF]">
          <span className="text-3xl">👋</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#111' }}>환영합니다!</h1>
        <p className="mt-2 text-sm" style={{ color: '#555' }}>
          커뮤니티에서 사용할 닉네임을 정해주세요
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="닉네임 입력 (2~12자)"
            maxLength={12}
            className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition"
            style={{ borderColor: error ? '#EF4444' : '#E5E7EB', color: '#111' }}
            autoFocus
          />
          <p className="mt-1.5 text-xs" style={{ color: '#999' }}>
            한글, 영문, 숫자 사용 가능 · 나중에 변경할 수 있어요
          </p>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || nickname.trim().length < 2}
          className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}
        >
          {loading ? '설정 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}
