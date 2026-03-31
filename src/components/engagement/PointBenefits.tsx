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
    points: 100,
    icon: '🧩',
    title: '조각 모집 글쓰기',
    desc: '같이 놀러갈 사람을 직접 모집할 수 있다. 혼자 가기 심심할 때 필수!',
    color: '#8B5CF6',
  },
  {
    points: 200,
    icon: '🎯',
    title: 'AI 맞춤 추천',
    desc: '내 취향·위치·시간에 딱 맞는 업소를 AI가 골라준다',
    color: '#06B6D4',
  },
  {
    points: 300,
    icon: '🗺️',
    title: '풀코스 자동 설계',
    desc: '저녁→술→마무리 동선을 짜준다. 어디갈지 고민 끝',
    color: '#10B981',
  },
  {
    points: 500,
    icon: '👔',
    title: '드레스코드 가이드',
    desc: '업소별 뭐 입으면 되는지, 뭐 입으면 안 되는지 사진으로 알려준다',
    color: '#F59E0B',
  },
  {
    points: 1000,
    icon: '💬',
    title: '대화 주제 카드',
    desc: '처음 만난 사람한테 뭐라고 말할지 모를 때. 분위기 살리는 대화 카드 5장',
    color: '#EC4899',
  },
  {
    points: 2000,
    icon: '🎟️',
    title: '제휴업소 무료입장권 추첨',
    desc: '매월 2000P 이상 보유자 중 추첨으로 제휴업소 무료입장권 증정. 실제 돈 아끼는 혜택!',
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
