import NcH1 from '@/components/seo/NcH1';
import { useState, useRef } from 'react';
import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, ReadFinishCount, MidContentQuiz, ReadingMilestone } from '@/components/engagement/ReadingEngagement';

const hiddenGems = [
  {
    name: '일산명월관요정',
    region: '일산',
    category: '요정',
    hook: '15가지 한정식에 국악 라이브까지, 요정 문화의 격을 잇는다',
    // [일산76-1 · 2026-11-13] 사실은 src/data/ilsanmyeongwolgwan-confirmed.json(2026-07-30 업소 확인)만 — 옛 글의 룸 30개·정찰제는 확인 자료와 어긋나거나 없어 고쳤다
    reason: '일산명월관요정은 장항동 895-1 지하 1층에 있는 한정식 요정이고, 방은 모두 15개입니다. 계절마다 바뀌는 15첩 궁중 상차림에 거문고·해금 합주가 함께하고, 코스는 다도로 마무리합니다.',
    href: '/yojeong/ilsan/ilsanmyeongwolgwanyojeong',
    emoji: '🏮',
  },
  {
    name: '파주야당스카이돔나이트',
    region: '파주',
    category: '나이트',
    hook: '돔 지붕 아래 댄스홀이 있는 야당동 나이트',
    reason: '파주 야당동(소리천로 25)에 있는 나이트입니다. 가까운 역은 야당역이고, 돔 모양 지붕 아래 댄스홀과 라이브 음악이 있는 곳입니다.',
    href: '/nights/pajuyadangskydomenight',
    emoji: '🌙',
  },
  {
    name: '울산챔피언나이트',
    region: '울산',
    category: '나이트',
    hook: '복싱 글러브 네온사인이 걸린 삼산동 나이트',
    reason: '울산 남구 삼산동(정동로 75) 1층에 있는 나이트입니다. 가까운 역은 태화강역이고, 진행자가 마이크를 잡고 분위기를 끌어가는 곳입니다.',
    href: '/nights/ulsanchampionnight',
    emoji: '🌙',
  },
];

export default function HiddenPage() {
  useDocumentMeta('검색 안 해본 사람만 모르는 곳 — 골라 둔 숨은 업소 3곳', '놀쿨이 골라 둔 덜 알려진 가게 3곳을 소개합니다. 요정 한 곳과 나이트 두 곳이고, 알고 있는 숨은 곳이 있다면 커뮤니티에 알려 주세요.');
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

          <div className="text-6xl mb-4">🔮</div>
          <NcH1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            놀쿨이 골라 둔<br />
            <span style={{ color: '#C4B5FD' }}>숨은 곳</span>
          </NcH1>
          <p className="text-base mb-4" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.5)' }}>
            놀쿨이 골라 둔 덜 알려진 곳을 소개한다.<br />
            고른 곳이 늘면 여기에 더한다.
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-sm">🤫</span>
            <span className="text-xs font-medium" style={{ color: '#FCD34D' }}>현재 {hiddenGems.length}곳 공개 중</span>
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
                  <p className="text-sm font-bold text-[#111] mb-1">{gem.region} {gem.category}</p>
                  <p className="text-xs text-[#8B5CF6]">터치해서 공개하기</p>
                </button>
              ) : (
                /* 공개된 카드 */
                <Link
                  to={gem.href}
                  className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-[#8B5CF6]/30 animate-fade-in"
                >
                  <div className="flex items-center gap-2 mb-3">
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
          options={['현지 택시기사한테 물어본다', '커뮤니티 후기를 파본다', '직접 동네를 돌아다닌다', '여기서 골라 둔 곳을 본다']}
          seed="hidden-quiz"
        />

        {/* ═══ BOTTOM ═══ */}

        <div className="text-center mt-6">
          <ReadFinishCount pageName="숨은 명소" baseCount={170} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
