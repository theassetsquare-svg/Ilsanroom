import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, ReadFinishCount, ReadCompletionReward, MidContentQuiz, ReadingMilestone } from '@/components/engagement/ReadingEngagement';

const hiddenGems = [
  {
    name: '일산명월관요정',
    region: '일산',
    category: '요정',
    hook: '15가지 한정식에 국악 라이브까지, 요정 문화의 끝판왕',
    reason: '전통 요정이 전국에 거의 남아있지 않은 상황에서, 일산명월관요정은 30개 프라이빗 룸과 정찰제 한정식을 유지하며 전통 문화를 이어가고 있습니다. 비즈니스 접대와 거래처 만찬에 활용되는 희소한 공간입니다.',
    href: '/yojeong/ilsan/ilsanmyeongwolgwanyojeong',
    week: '이번 달 2주차',
    emoji: '🏮',
  },
  {
    name: '파주야당스카이돔나이트',
    region: '파주',
    category: '나이트',
    hook: '경기 북부 유일의 대형 나이트, 높은 천장의 개방감',
    reason: '파주·일산·김포 지역에서 접근할 수 있는 대형 나이트클럽으로, 스카이돔이라는 이름에 걸맞은 높은 천장과 넓은 댄스 플로어가 특징입니다. 야당역 도보 접근 가능.',
    href: '/nights/pajuyadangskydomenight',
    week: '이번 달 1주차',
    emoji: '🌙',
  },
  {
    name: '울산챔피언나이트',
    region: '울산',
    category: '나이트',
    hook: '울산 공단 직장인들의 주말 해방구',
    reason: '울산 지역 나이트 문화의 중심. 춘자 실장의 친절한 운영으로 초보 방문객도 편안하게 즐길 수 있는 곳입니다.',
    href: '/nights/ulsanchampionnight',
    week: '지난 달 4주차',
    emoji: '🌙',
  },
];

export default function HiddenPage() {
  useDocumentMeta('단골만 알던 곳, 여기서 처음 공개한다', '매주 1곳씩 비공개 업소 오픈. 아는 사람만 가던 곳을 꺼냈다.');
  const [revealedIdx, setRevealedIdx] = useState<Set<number>>(new Set([0]));
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO — 미스터리 테마 ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#0f0720] to-[#1a0a2e]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #8B5CF6 0%, transparent 60%)' }} />
        {/* 반짝이는 점들 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white animate-pulse"
              style={{
                top: `${15 + (i * 7) % 70}%`,
                left: `${10 + (i * 13) % 80}%`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.3 + (i % 3) * 0.2,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/10">
            <PageLiveCounter pageName="이 페이지" baseCount={22} className="text-white/80 [&_strong]:text-white" />
          </div>

          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            단골만 알던 곳,<br />
            <span style={{ color: '#C4B5FD' }}>여기서 처음 공개한다</span>
          </h1>
          <p className="text-base mb-4" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.5)' }}>
            매주 1곳씩 숨겨진 명소를 발굴한다.<br />
            아는 사람만 가던 곳을 처음 꺼냈다.
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-sm">🤫</span>
            <span className="text-xs font-medium" style={{ color: '#FCD34D' }}>현재 {hiddenGems.length}곳 공개 중 · 다음 공개까지 D-3</span>
          </div>
        </div>
      </div>

      {/* ═══ HIDDEN GEMS ═══ */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="space-y-6">
          {hiddenGems.map((gem, idx) => (
            <div key={gem.name}>
              {!revealedIdx.has(idx) ? (
                /* 잠긴 카드 */
                <button
                  onClick={() => setRevealedIdx(prev => new Set(prev).add(idx))}
                  className="w-full rounded-2xl border-2 border-dashed border-[#8B5CF6]/30 bg-gradient-to-br from-[#F8F6FF] to-white p-8 text-center transition-all hover:border-[#8B5CF6]/50 hover:shadow-lg active:scale-[0.99]"
                  style={{ minHeight: 120 }}
                >
                  <span className="text-4xl block mb-3">🔒</span>
                  <p className="text-sm font-bold text-[#111] mb-1">{gem.week} 발굴 업소</p>
                  <p className="text-xs text-[#8B5CF6]">터치해서 공개하기</p>
                </button>
              ) : (
                /* 공개된 카드 */
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  to={gem.href}
                  className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-[#8B5CF6]/30 animate-fade-in"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-full bg-[#8B5CF6]/10 px-3 py-1 text-xs font-bold text-[#8B5CF6]">{gem.week}</span>
                    <span className="text-xs text-[#999]">{gem.region} · {gem.category}</span>
                    <span className="ml-auto text-xl">{gem.emoji}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#111] mb-2">{gem.name}</h2>
                  <p className="text-sm font-medium mb-3" style={{ color: '#D97706' }}>{gem.hook}</p>
                  <p className="text-sm text-[#555] leading-relaxed" style={{ lineHeight: '1.7' }}>{gem.reason}</p>
                  <p className="mt-4 text-sm font-bold text-[#8B5CF6]">자세히 보기 →</p>
                </Link>
              )}

              {idx === 0 && <MidContentHook seed="hidden-mid" variant={4} />}
            </div>
          ))}
        </div>

        {/* 퀴즈 */}
        <MidContentQuiz
          question="숨은 명소, 어떻게 찾아?"
          options={['현지 택시기사한테 물어본다', '커뮤니티 후기를 파본다', '직접 동네를 돌아다닌다', '여기서 매주 발굴되는 걸 본다']}
          seed="hidden-quiz"
        />

        {/* ═══ BOTTOM ═══ */}
        <ReadCompletionReward teaser="다음 주 공개될 곳의 힌트">
          <div className="space-y-2">
            <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              힌트: 다음 주 공개될 곳은 <strong>경기도 남부</strong>에 있고,
              <strong>30년 넘은 역사</strong>를 가진 곳이다.
              단골만 아는 숨겨진 시스템이 있다는 소문.
            </p>
            <p className="text-xs text-[#999] mt-2">매주 월요일 업데이트</p>
          </div>
        </ReadCompletionReward>

        <div className="text-center mt-6">
          <ReadFinishCount pageName="숨은 명소" baseCount={170} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
