
import { useState, useRef } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Link } from 'react-router-dom';
import { PageLiveCounter, GuideReadCount } from '@/components/ui/LiveStats';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';
import { MidContentHook, ReadFinishCount, ReadCompletionReward, NextSectionTeaser, MidContentQuiz, ReadingMilestone } from '@/components/engagement/ReadingEngagement';

const guides = [
  {
    category: '클럽',
    icon: '🎵',
    dress: '스마트 캐주얼 (셔츠+슬랙스 or 깔끔한 청바지). 슬리퍼/운동복 입장 제한.',
    budget: '입장료 2~3만 + 음료 1~2만 선. 테이블 예약 시 35~50 비용.',
    alone: '혼자 방문 가능. 바 카운터에서 음료 마시며 느낌 즐기다 댄스플로어 합류.',
    manner: 'DJ 부스 촬영 금지. 다른 사람 촬영 동의 필수. 신분증 필수.',
    bestTime: '금토 23시 이후 피크. 0~2시가 절정.',
    nextTeaser: '클럽 다음엔? 나이트가 어떻게 다른지 알아야 한다',
  },
  {
    category: '나이트',
    icon: '🌙',
    dress: '세미 포멀~포멀 픽. 정장 또는 셋업이 기본.',
    budget: '입장료 1~3만원 + 양주 1병 10~30만 선. 부스/룸 추가 비용.',
    alone: '웨이터에게 안내 요청하면 부스 배정. 부킹 시스템으로 파트너 매칭.',
    manner: '웨이터 호출 시 손 들기. 부킹 시 예의. 과음 주의.',
    bestTime: '금토 20~21시 입장 추천. 23시 이후 피크.',
    nextTeaser: '나이트와 라운지, 분위기가 완전히 다르다. 차이점 바로 아래',
  },
  {
    category: '라운지',
    icon: '🍸',
    dress: '스마트 캐주얼 이상. 깔끔하게 입고 가면 돼.',
    budget: '칵테일 1잔 1.5~3만원. 독립 부스 최소 주문 있을 수 있음.',
    alone: '혼자 방문 매우 적합. 바 카운터에서 바텐더와 담소.',
    manner: '조용한 느낌 존중. 큰 소리 자제.',
    bestTime: '평일 저녁 20시 이후. 주말은 미리 예약.',
    nextTeaser: '룸은 사람들이 가장 궁금해하는 업종이다. 핵심만 정리했다',
  },
  {
    category: '룸',
    icon: '🚪',
    dress: '캐주얼~비즈니스 캐주얼. 모임 목적에 맞게.',
    budget: '룸 이용료 + 음료. 매장마다 다름. 전화 문의 필수.',
    alone: '보통 2인 이상 이용. 1인 이용 가능 여부 매장에 확인.',
    manner: '시설 소중히. 퇴실 시간 준수.',
    bestTime: '평일 저녁 회식, 주말 친구 모임.',
    nextTeaser: '요정은 대부분 처음이다. 격식부터 문화까지 아래에 전부 적었다',
  },
  {
    category: '요정',
    icon: '🏮',
    dress: '세미 포멀 이상 필수. 전통 요정의 격조에 맞는 착장.',
    budget: '한정식 코스 20~100만원+. 정찰제 매장 확인.',
    alone: '1인 이용보다 접대/모임 목적. 미리 예약 필수.',
    manner: '전통 문화 존중. 국악 공연 중 조용히.',
    bestTime: '저녁 18~22시. 미리 예약 필수.',
    nextTeaser: '호빠는 여성분들이 가장 많이 찾는 업종. 마지막 가이드를 꼭 봐',
  },
  {
    category: '호빠',
    icon: '🥂',
    dress: '깔끔한 복장이면 충분.',
    budget: '매장마다 다름. 전화 상담 뒤 방문.',
    alone: '혼자 또는 소그룹 입장. 직원이 안내.',
    manner: '직원 존중. 과도한 요구 자제.',
    bestTime: '저녁 21시 이후.',
    nextTeaser: '',
  },
];

export default function GuidePage() {
  useDocumentMeta('처음이라 긴장된다고? 이거 읽고 가면 프로다', '드레스코드, 예산, 혼자 가도 되는지까지. 업종별 입문 핵심만 정리했다.');
  const [openGuide, setOpenGuide] = useState<string | null>('클럽');
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO SECTION ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #8B5CF6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #EC4899 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <PageLiveCounter pageName="이 가이드" baseCount={45} className="text-white/80 [&_strong]:text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            처음이라 긴장된다고?<br />
            <span style={{ color: '#A78BFA' }}>이거 읽고 가면 프로다</span>
          </h1>
          <p className="text-base mb-6 max-w-lg mx-auto" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.6)' }}>
            드레스코드, 예산, 혼자 가도 되는지까지.<br />
            업종별 핵심만 2분이면 끝난다.
          </p>

          {/* 업종 빠른 이동 */}
          <div className="flex flex-wrap justify-center gap-2">
            {guides.map((g) => (
              <button
                key={g.category}
                onClick={() => {
                  setOpenGuide(g.category);
                  document.getElementById(`guide-${g.category}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm transition hover:bg-white/20 border border-white/5"
                style={{ minHeight: 44, color: 'rgba(255,255,255,0.9)' }}
              >
                <span>{g.icon}</span> {g.category}
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>총 <strong style={{ color: '#8B5CF6' }}>8,420</strong>명이 이 가이드로 첫 방문 성공</p>
        </div>
      </div>

      {/* ═══ GUIDE CARDS ═══ */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="space-y-6">
          {guides.map((g, idx) => (
            <div key={g.category}>
              <div
                id={`guide-${g.category}`}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md scroll-mt-24"
              >
                <button
                  onClick={() => setOpenGuide(openGuide === g.category ? null : g.category)}
                  className="w-full flex items-center justify-between mb-4"
                  style={{ minHeight: 44 }}
                >
                  <h2 className="text-xl font-bold text-[#111] flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-xl">{g.icon}</span>
                    {g.category} 첫 방문 가이드
                  </h2>
                  <div className="flex items-center gap-3">
                    <GuideReadCount category={g.category} />
                    <span className={`text-xl transition-transform ${openGuide === g.category ? 'rotate-180' : ''}`} style={{ color: '#9CA3AF' }}>▾</span>
                  </div>
                </button>

                {openGuide === g.category && (
                  <div className="animate-fade-in">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <h3 className="text-xs font-bold text-[#8B5CF6] mb-2 flex items-center gap-1">👔 복장 규정</h3>
                        <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>{g.dress}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <h3 className="text-xs font-bold text-[#EC4899] mb-2 flex items-center gap-1">💰 얼마나 들지?</h3>
                        <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>{g.budget}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <h3 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#059669' }}>🙋 혼자 가도 되나?</h3>
                        <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>{g.alone}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <h3 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#D97706' }}>🤝 매너/에티켓</h3>
                        <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>{g.manner}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <h3 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#2563EB' }}>🕐 언제 가면 좋지?</h3>
                        <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>{g.bestTime}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 다음 가이드 티저 */}
              {g.nextTeaser && idx < guides.length - 1 && (
                <NextSectionTeaser text={g.nextTeaser} emoji="👇" />
              )}

              {/* 중간 훅 (3번째 가이드 뒤) */}
              {idx === 2 && <MidContentHook seed="guide-mid" variant={5} />}
            </div>
          ))}
        </div>

        {/* 중간 퀴즈 */}
        <MidContentQuiz
          question="첫 방문이라면 어떤 업종이 가장 편할까?"
          options={['라운지 — 혼자 가기 제일 좋다', '클럽 — 분위기에 섞이면 된다', '나이트 — 부킹 시스템이 있어서 편하다', '룸 — 프라이빗하니까 부담 없다']}
          seed="guide-quiz"
        />

        {/* ═══ 실시간 활동 피드 ═══ */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-bold mb-3" style={{ color: '#6B7280' }}>실시간 커뮤니티 활동</p>
          <LiveActivityFeed maxItems={4} interval={8000} />
        </div>

        {/* ═══ BOTTOM REWARD ═══ */}
        <ReadCompletionReward teaser="끝까지 읽은 사람만 보는 첫 방문 꿀팁">
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#111]">현직 실장들이 알려주는 첫 방문 꿀팁 3가지</p>
            <ul className="text-sm text-[#555] space-y-2" style={{ lineHeight: '1.7' }}>
              <li>1. <strong>금요일 22시</strong>에 가면 사람이 적당해서 분위기 파악하기 딱 좋다</li>
              <li>2. 첫 방문이면 <strong>웨이터한테 처음 왔다고</strong> 말해라. 더 잘 챙겨준다</li>
              <li>3. <strong>2차 갈 곳</strong>까지 미리 정해놓고 가면 밤이 훨씬 알차다</li>
            </ul>
          </div>
        </ReadCompletionReward>

        {/* 완독자 수 + CTA */}
        <div className="mt-6 text-center space-y-4">
          <ReadFinishCount pageName="이 가이드" baseCount={180} />
          <Link to="/community" className="inline-flex items-center gap-2 rounded-xl bg-[#8B5CF6] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-[#7C3AED]" style={{ minHeight: 52 }}>
            커뮤니티에서 추천받기 →
          </Link>
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
