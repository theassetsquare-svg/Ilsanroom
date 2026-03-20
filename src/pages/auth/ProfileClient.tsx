

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold text-neon-text mb-4">로그인이 필요합니다</p>
        <a href="/login" className="inline-block rounded-xl bg-neon-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-neon-primary-light">
          로그인하기
        </a>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || '사용자';
  const email = user.email || '';
  const avatar = user.user_metadata?.avatar_url || '';
  const provider = user.app_metadata?.provider || '';

  return (
    <div>
      <h1 className="mb-8 text-center text-2xl font-bold text-neon-text">내 프로필</h1>

      {/* Avatar + 이름 */}
      <div className="mb-8 flex flex-col items-center">
        {avatar ? (
          <img src={avatar} alt={name} className="mb-4 h-24 w-24 rounded-full border-2 border-neon-border" />
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-neon-primary/20 text-3xl text-neon-primary font-bold">
            {name.charAt(0)}
          </div>
        )}
        <p className="text-lg font-bold text-neon-text">{name}</p>
        <p className="text-sm text-neon-text-muted">{email}</p>
        <span className="mt-2 rounded-full bg-neon-surface-2 px-3 py-1 text-xs text-neon-text-muted">
          {provider === 'google' ? 'Google' : provider === 'kakao' ? '카카오' : provider} 로그인
        </span>
      </div>

      {/* 구독 상태 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-neon-text">구독 상태</h2>
        <div className="rounded-xl border border-neon-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-neon-text">현재 플랜</span>
              <p className="text-lg font-bold text-neon-text">무료 플랜</p>
            </div>
            <span className="rounded-full bg-neon-surface-2 px-3 py-1 text-xs font-medium text-neon-text-muted">FREE</span>
          </div>
          <a href="/pricing" target="_blank" rel="noopener noreferrer"
            className="block w-full rounded-xl border border-neon-primary bg-neon-primary/5 py-2.5 text-center text-sm font-medium text-neon-primary transition hover:bg-neon-primary/10">
            프리미엄으로 업그레이드
          </a>
        </div>
      </div>

      {/* 로그아웃 */}
      <div className="mb-8">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-neon-border bg-white py-3 text-sm font-medium text-neon-text transition hover:bg-neon-surface-2"
        >
          로그아웃
        </button>
      </div>

      {/* 회원 탈퇴 */}
      <div className="my-8 h-px bg-neon-border" />
      <div>
        <h2 className="mb-4 text-lg font-bold text-neon-red">회원 탈퇴</h2>
        <div className="rounded-xl border border-neon-red/20 bg-red-50 p-5">
          <p className="mb-4 text-sm text-neon-text-muted">
            탈퇴 시 30일 유예 후 모든 데이터가 삭제됩니다. 30일 내 로그인하면 취소됩니다.
          </p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-xl border border-neon-red/30 py-3 text-sm font-medium text-neon-red transition hover:bg-red-50">
              회원 탈퇴 신청
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-neon-red">정말 탈퇴하시겠습니까?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-neon-border py-2.5 text-sm font-medium text-neon-text transition hover:bg-neon-surface-2">
                  취소
                </button>
                <button className="flex-1 rounded-xl bg-neon-red py-2.5 text-sm font-medium text-white transition hover:bg-red-600">
                  탈퇴 확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
