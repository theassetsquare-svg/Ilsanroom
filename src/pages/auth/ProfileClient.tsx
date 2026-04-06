import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { useEngagementStore } from '@/lib/engagement-store';

const LEVELS = [
  { min: 0, name: '🌱 입문자', title: '밤문화 초심자', nextAt: 50, perks: ['업소 정보 보기', '검색 무제한'] },
  { min: 50, name: '⭐ 탐험가', title: '발걸음을 내딛다', nextAt: 150, perks: ['댓글 작성', '조각모집 글쓰기', '업소 후기 읽기'] },
  { min: 150, name: '🔥 단골', title: '이 동네 좀 아는 사람', nextAt: 400, perks: ['커뮤니티 글쓰기', '업소 찜하기', '주간 핫플 알림'] },
  { min: 400, name: '💎 VIP', title: '밤의 귀족', nextAt: 1000, perks: ['VIP 전용 숨겨진 업소 열람', '우선 예약 안내', 'AI 맞춤 추천'] },
  { min: 1000, name: '👑 마스터', title: '전설의 시작', nextAt: 2500, perks: ['명예의 전당 등록', '프리미엄 배지', '마스터 전용 이벤트'] },
  { min: 2500, name: '🏆 그랜드마스터', title: '밤의 지배자', nextAt: 5000, perks: ['그랜드마스터 칭호', '분기별 특별 혜택', '신규 업소 우선 정보'] },
  { min: 5000, name: '🐉 레전드', title: '전설 그 자체', nextAt: null, perks: ['최고 등급 칭호', '연간 VIP 파티 초대', '놀쿨 공식 앰배서더'] },
];

function getLevel(points: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const store = useEngagementStore();
  const points = store.points;
  const streak = store.streak;
  const venuesViewed = store.venuesViewed?.length || 0;
  const level = getLevel(points);
  const nextLevel = level.index < LEVELS.length - 1 ? LEVELS[level.index + 1] : null;
  const progress = nextLevel ? ((points - level.min) / (nextLevel.min - level.min)) * 100 : 100;

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
        <Link to="/login" className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6', minHeight: 48 }}>
          로그인하기
        </Link>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || '사용자';
  const email = user.email || '';
  const avatar = user.user_metadata?.avatar_url || '';

  return (
    <div className="mx-auto max-w-[600px] px-4 py-6">
      {/* 프로필 카드 */}
      <div className="mb-6 rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' }}>
        {avatar ? (
          <img src={avatar} alt={name} className="mx-auto mb-3 h-20 w-20 rounded-full border-4 border-white/30" />
        ) : (
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold text-white">
            {name.charAt(0)}
          </div>
        )}
        <p className="text-xl font-bold text-white">{name}</p>
        <p className="text-sm text-white/70">{email}</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2">
          <span className="text-base font-bold text-white">{level.name}</span>
        </div>
        <p className="mt-1 text-xs text-white/60">{level.title}</p>
      </div>

      {/* 스탯 카드 */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#8B5CF6' }}>{points}</p>
          <p className="text-xs" style={{ color: '#888' }}>경험치</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#F97316' }}>{streak}일</p>
          <p className="text-xs" style={{ color: '#888' }}>연속출석</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <p className="text-2xl font-black" style={{ color: '#06B6D4' }}>{venuesViewed}곳</p>
          <p className="text-xs" style={{ color: '#888' }}>탐색 완료</p>
        </div>
      </div>

      {/* 경험치 바 */}
      {nextLevel && (
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: '#111' }}>{nextLevel.name}까지</span>
            <span className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{points} / {nextLevel.min}</span>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%`, background: 'linear-gradient(90deg, #8B5CF6, #EC4899)' }} />
          </div>
          <p className="mt-2 text-xs" style={{ color: '#888' }}>
            {nextLevel.min - points} 경험치 더 모으면 승급!
          </p>
        </div>
      )}

      {/* 등급 로드맵 — 리니지 스타일 */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
        <h2 className="mb-4 text-base font-bold" style={{ color: '#111' }}>등급 로드맵</h2>
        <div className="relative">
          {/* 연결선 */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ backgroundColor: '#E5E7EB' }} />

          <div className="space-y-4">
            {LEVELS.map((lv, i) => {
              const reached = points >= lv.min;
              const current = level.index === i;
              return (
                <div key={i} className="relative flex items-start gap-4 pl-2">
                  {/* 노드 */}
                  <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    current ? 'ring-2 ring-offset-2' : ''
                  }`} style={{
                    backgroundColor: reached ? '#8B5CF6' : '#E5E7EB',
                    color: reached ? '#FFF' : '#999',
                    ringColor: current ? '#8B5CF6' : undefined,
                  }}>
                    {reached ? '✓' : i + 1}
                  </div>

                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${current ? '' : ''}`} style={{ color: reached ? '#111' : '#999' }}>
                        {lv.name}
                      </span>
                      {current && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>현재</span>
                      )}
                      <span className="text-xs" style={{ color: '#CCC' }}>{lv.min}P</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {lv.perks.map((perk, j) => (
                        <span key={j} className="rounded-full px-2 py-0.5 text-xs" style={{
                          backgroundColor: reached ? '#F3F0FF' : '#F9FAFB',
                          color: reached ? '#7C3AED' : '#CCC',
                        }}>
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 경험치 모으는 법 */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
        <h2 className="mb-3 text-base font-bold" style={{ color: '#111' }}>경험치 모으는 법</h2>
        <div className="space-y-2 text-sm" style={{ color: '#555' }}>
          <p>📖 업소 구경하기 → 5~12P</p>
          <p>💬 댓글 작성 → 10P</p>
          <p>✍️ 글쓰기 → 20P</p>
          <p>🗳️ VS투표 참여 → 15P</p>
          <p>🔥 매일 출석 → 30~150P (연속 보너스!)</p>
          <p>📸 클립 사진 올리기 → 25P</p>
        </div>
      </div>

      {/* 바로가기 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link to="/community/jogak" className="rounded-xl bg-white p-4 text-center shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span className="text-lg">🧩</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>조각 모집</p>
        </Link>
        <Link to="/gallery" className="rounded-xl bg-white p-4 text-center shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span className="text-lg">📸</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>클립</p>
        </Link>
        <Link to="/community" className="rounded-xl bg-white p-4 text-center shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span className="text-lg">💬</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>커뮤니티</p>
        </Link>
        <Link to="/ranking" className="rounded-xl bg-white p-4 text-center shadow-sm transition active:scale-[0.98]" style={{ border: '1px solid #E5E7EB', minHeight: 48 }}>
          <span className="text-lg">🏆</span>
          <p className="text-sm font-medium mt-1" style={{ color: '#111' }}>랭킹</p>
        </Link>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="mb-4 w-full rounded-xl bg-white py-3 text-sm font-medium transition active:scale-[0.98] shadow-sm"
        style={{ border: '1px solid #E5E7EB', color: '#555', minHeight: 48 }}
      >
        로그아웃
      </button>
    </div>
  );
}
