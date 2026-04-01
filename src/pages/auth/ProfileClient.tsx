import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { useEngagementStore } from '@/lib/engagement-store';

function getLevelInfo(points: number) {
  if (points >= 5000) return { level: '✨ 신화', next: null, nextPoints: null, color: '#F59E0B' };
  if (points >= 3000) return { level: '🔥 마스터', next: '✨ 신화', nextPoints: 5000, color: '#EF4444' };
  if (points >= 1500) return { level: '👑 레전드', next: '🔥 마스터', nextPoints: 3000, color: '#EC4899' };
  if (points >= 700) return { level: '💎 VIP', next: '👑 레전드', nextPoints: 1500, color: '#8B5CF6' };
  if (points >= 300) return { level: '🔥 매니아', next: '💎 VIP', nextPoints: 700, color: '#F97316' };
  if (points >= 100) return { level: '⭐ 탐험가', next: '🔥 매니아', nextPoints: 300, color: '#06B6D4' };
  return { level: '🌱 뉴비', next: '⭐ 탐험가', nextPoints: 100, color: '#22C55E' };
}

const PERKS = [
  { points: 0, label: '업소 정보 열람 (상세 절반)', icon: '👁️' },
  { points: 100, label: '업소 상세 전체 열람 + 댓글 + 조각 글쓰기', icon: '⭐' },
  { points: 300, label: '커뮤니티 글쓰기 + 업소 찜하기 + AI 추천', icon: '🔥' },
  { points: 700, label: 'AI 코스 설계 + AI 취향 분석', icon: '💎' },
  { points: 1500, label: 'AI 전체 해금 + VIP 전용 게시판', icon: '👑' },
  { points: 3000, label: '월간 무료입장권 추첨 + 명예의 전당', icon: '🔥' },
  { points: 5000, label: '분기 프라이빗 파티 초대', icon: '✨' },
];

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const store = useEngagementStore();
  const points = store.points;
  const streak = store.streak;
  const venuesViewed = store.venuesViewed?.length || 0;
  const info = getLevelInfo(points);

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
        <p className="text-lg font-bold mb-4" style={{ color: '#111' }}>로그인이 필요합니다</p>
        <Link target="_blank" rel="noopener noreferrer" to="/login" className="inline-block rounded-xl px-6 py-3 text-sm font-medium text-white" style={{ backgroundColor: '#8B5CF6' }}>
          로그인하기
        </Link>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || '사용자';
  const email = user.email || '';
  const avatar = user.user_metadata?.avatar_url || '';
  const provider = user.app_metadata?.provider || '';

  return (
    <div className="mx-auto max-w-[600px]">
      <h1 className="mb-8 text-center text-2xl font-bold" style={{ color: '#111' }}>마이페이지</h1>

      {/* 프로필 카드 */}
      <div className="mb-6 rounded-2xl border bg-white p-6 text-center" style={{ borderColor: '#E5E7EB' }}>
        {avatar ? (
          <img src={avatar} alt={name} className="mx-auto mb-3 h-20 w-20 rounded-full border-2" style={{ borderColor: info.color }} />
        ) : (
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: info.color }}>
            {name.charAt(0)}
          </div>
        )}
        <p className="text-lg font-bold" style={{ color: '#111' }}>{name}</p>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>{email}</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ backgroundColor: info.color + '15', color: info.color }}>
          <span className="text-sm font-bold">{info.level}</span>
        </div>
      </div>

      {/* 포인트 + 스트릭 + 탐색 */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{points}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>포인트</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#F97316' }}>{streak}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>연속출석</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#06B6D4' }}>{venuesViewed}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>탐색 업소</p>
        </div>
      </div>

      {/* 다음 등급 진행률 */}
      {info.nextPoints && (
        <div className="mb-6 rounded-2xl border bg-white p-5" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: '#111' }}>다음 등급: {info.next}</span>
            <span className="text-sm" style={{ color: '#8B5CF6' }}>{points} / {info.nextPoints}P</span>
          </div>
          <div className="h-3 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (points / info.nextPoints) * 100)}%`, backgroundColor: info.color }} />
          </div>
          <p className="mt-2 text-xs" style={{ color: '#9CA3AF' }}>
            {info.nextPoints - points}P 더 모으면 {info.next} 달성!
          </p>
        </div>
      )}

      {/* 등급별 혜택 */}
      <div className="mb-6 rounded-2xl border bg-white p-5" style={{ borderColor: '#E5E7EB' }}>
        <h2 className="mb-4 text-base font-bold" style={{ color: '#111' }}>등급별 혜택</h2>
        <div className="space-y-3">
          {PERKS.map((perk) => {
            const unlocked = points >= perk.points;
            return (
              <div key={perk.points} className="flex items-center gap-3">
                <span className={`text-lg ${unlocked ? '' : 'grayscale opacity-40'}`}>{perk.icon}</span>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: unlocked ? '#111' : '#9CA3AF' }}>
                    {perk.label}
                  </p>
                </div>
                <span className="text-xs font-bold" style={{ color: unlocked ? '#22C55E' : '#D1D5DB' }}>
                  {unlocked ? '해금' : `${perk.points}P`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 바로가기 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link target="_blank" rel="noopener noreferrer" to="/community/jogak" className="rounded-xl border bg-white p-4 text-center transition hover:shadow-md min-h-[44px]" style={{ borderColor: '#E5E7EB' }}>
          <span className="text-lg">🧩</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>조각 모집</p>
        </Link>
        <Link target="_blank" rel="noopener noreferrer" to="/community" className="rounded-xl border bg-white p-4 text-center transition hover:shadow-md min-h-[44px]" style={{ borderColor: '#E5E7EB' }}>
          <span className="text-lg">💬</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>커뮤니티</p>
        </Link>
        <Link target="_blank" rel="noopener noreferrer" to="/ranking" className="rounded-xl border bg-white p-4 text-center transition hover:shadow-md min-h-[44px]" style={{ borderColor: '#E5E7EB' }}>
          <span className="text-lg">🏆</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>랭킹</p>
        </Link>
        <Link target="_blank" rel="noopener noreferrer" to="/quiz" className="rounded-xl border bg-white p-4 text-center transition hover:shadow-md min-h-[44px]" style={{ borderColor: '#E5E7EB' }}>
          <span className="text-lg">🎯</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>퀴즈</p>
        </Link>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="mb-6 w-full rounded-xl border bg-white py-3 text-sm font-medium transition hover:bg-gray-50 min-h-[44px]"
        style={{ borderColor: '#E5E7EB', color: '#555' }}
      >
        로그아웃
      </button>

      {/* 회원 탈퇴 */}
      <div className="rounded-2xl border p-5" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
        <p className="text-sm mb-3" style={{ color: '#991B1B' }}>
          탈퇴 시 30일 유예 후 모든 데이터가 삭제됩니다.
        </p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-xl border py-2.5 text-sm font-medium transition min-h-[44px]"
            style={{ borderColor: '#FCA5A5', color: '#DC2626' }}>
            회원 탈퇴
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl border py-2.5 text-sm min-h-[44px]" style={{ borderColor: '#D1D5DB', color: '#555' }}>취소</button>
            <button className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white min-h-[44px]" style={{ backgroundColor: '#DC2626' }}>탈퇴 확인</button>
          </div>
        )}
      </div>
    </div>
  );
}
