import { Link } from 'react-router-dom';
import { useEngagementStore } from '@/lib/engagement-store';

/**
 * 포인트 혜택 안내 — 체류 유도의 핵심
 *
 * "포인트 모으면 뭐가 좋아?" → 명확한 답을 보여줘야 체류한다
 * 혜택이 보여야 → 미션 참여 → 체류시간 증가 → 광고 노출 증가
 */

const BENEFITS = [
  {
    points: 50,
    icon: '🔓',
    title: '숨겨진 후기 열람',
    desc: '일반 공개되지 않는 솔직 후기를 볼 수 있다',
    color: '#8B5CF6',
  },
  {
    points: 150,
    icon: '📞',
    title: '담당자 직통 연결',
    desc: '광고주 업소 담당자에게 바로 전화 가능',
    color: '#06B6D4',
  },
  {
    points: 300,
    icon: '🏷️',
    title: '할인 쿠폰 교환',
    desc: '제휴 업소 입장료·음료 할인 쿠폰',
    color: '#10B981',
  },
  {
    points: 500,
    icon: '💎',
    title: 'VIP 뱃지 획득',
    desc: '커뮤니티 닉네임 옆 VIP 표시 + 글 상위 노출',
    color: '#F59E0B',
  },
  {
    points: 1000,
    icon: '👑',
    title: '프리미엄 정보 해금',
    desc: '실시간 혼잡도·가격대·내부 사진 추가 열람',
    color: '#EC4899',
  },
  {
    points: 2000,
    icon: '🎁',
    title: '월간 추첨 자동 응모',
    desc: '매월 2000P 이상 보유자 중 추첨 → 제휴업소 무료 이용권',
    color: '#EF4444',
  },
];

const EARN_METHODS = [
  { action: '페이지 스크롤', points: '3~12P', time: '읽는 동안' },
  { action: '체류 보너스', points: '10~500P', time: '1분~90분' },
  { action: '일일 미션', points: '15~50P', time: '미션당' },
  { action: 'VS 투표', points: '20P', time: '투표 1회' },
  { action: '퀴즈 참여', points: '30P', time: '1회' },
  { action: '연속출석', points: '2배', time: '매일 접속' },
];

export default function PointBenefits() {
  const store = useEngagementStore();
  const currentPoints = store.points;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-neon-border bg-white p-6 sm:p-8">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold" style={{ color: '#111' }}>
            포인트 모으면 이런 혜택이!
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#555' }}>
            오래 머물수록 포인트가 쌓이고, 포인트가 쌓일수록 혜택이 열린다
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2" style={{ backgroundColor: '#8B5CF6', color: '#fff' }}>
            <span className="text-sm font-bold">내 포인트</span>
            <span className="text-lg font-extrabold">{currentPoints}P</span>
          </div>
        </div>

        {/* 혜택 카드 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => {
            const unlocked = currentPoints >= b.points;
            return (
              <div
                key={b.points}
                className={`rounded-xl border p-4 transition-all ${
                  unlocked
                    ? 'border-2 shadow-md'
                    : 'border-gray-200 opacity-70'
                }`}
                style={unlocked ? { borderColor: b.color } : undefined}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#111' }}>
                      {b.title}
                      {unlocked && <span className="ml-2 text-xs" style={{ color: b.color }}>해금!</span>}
                    </p>
                    <p className="text-xs" style={{ color: '#888' }}>{b.points}P 필요</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#555' }}>{b.desc}</p>
                {!unlocked && (
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (currentPoints / b.points) * 100)}%`,
                          backgroundColor: b.color,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs" style={{ color: '#999' }}>
                      {b.points - currentPoints}P 더 모으면 해금
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 포인트 얻는 방법 */}
        <div className="mt-8 rounded-xl p-5" style={{ backgroundColor: '#F8F7FF' }}>
          <h3 className="mb-4 text-base font-bold" style={{ color: '#111' }}>
            포인트 얻는 방법
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EARN_METHODS.map((m) => (
              <div key={m.action} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 border border-gray-100">
                <span className="text-sm font-medium" style={{ color: '#111' }}>{m.action}</span>
                <span className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{m.points}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm font-semibold" style={{ color: '#8B5CF6' }}>
            지금 스크롤만 해도 포인트가 쌓이고 있다!
          </p>
        </div>
      </div>
    </section>
  );
}
