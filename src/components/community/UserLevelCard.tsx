import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getLevelFromPoints, USER_LEVELS, fetchUserProfile } from '@/lib/user-level';

export default function UserLevelCard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    nickname: string;
    points: number;
    review_count: number;
    comment_count: number;
    post_count: number;
    level: string;
    badges: string[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchUserProfile(user.id).then(data => {
      if (data) setProfile(data as any);
    });
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5 text-center">
        <p className="text-neon-text-muted text-sm mb-2">로그인하면 나의 등급을 확인할 수 있어요</p>
        <a href="/login" className="text-sm text-violet-400 hover:underline">로그인</a>
      </div>
    );
  }

  const levelInfo = getLevelFromPoints(profile.points);

  return (
    <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-2xl">
          {levelInfo.icon}
        </div>
        <div>
          <div className="font-bold text-neon-text">{profile.nickname}</div>
          <span className={`inline-flex items-center gap-1 rounded-full ${levelInfo.bg} px-2 py-0.5 text-xs font-medium ${levelInfo.color}`}>
            {levelInfo.icon} {levelInfo.name}
          </span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-neon-text-muted mb-1">
          <span>{profile.points}P</span>
          {levelInfo.nextLevel && <span>다음: {levelInfo.nextLevel.icon} {levelInfo.nextLevel.name} ({levelInfo.nextLevel.minPoints}P)</span>}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neon-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${levelInfo.progress}%` }}
          />
        </div>
      </div>

      {/* 활동 통계 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-neon-surface-2 py-2">
          <div className="text-lg font-bold text-neon-text">{profile.review_count}</div>
          <div className="text-xs text-neon-text-muted">후기</div>
        </div>
        <div className="rounded-lg bg-neon-surface-2 py-2">
          <div className="text-lg font-bold text-neon-text">{profile.comment_count}</div>
          <div className="text-xs text-neon-text-muted">댓글</div>
        </div>
        <div className="rounded-lg bg-neon-surface-2 py-2">
          <div className="text-lg font-bold text-neon-text">{profile.post_count}</div>
          <div className="text-xs text-neon-text-muted">게시글</div>
        </div>
      </div>

      {/* 포인트 안내 */}
      <div className="mt-4 rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
        <p className="text-xs font-medium text-violet-400 mb-1">포인트 적립 방법</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-neon-text-muted">
          <span>후기 작성: +10P</span>
          <span>댓글 작성: +5P</span>
          <span>사진 업로드: +5P</span>
          <span>추천 받기: +2P</span>
        </div>
      </div>
    </div>
  );
}
