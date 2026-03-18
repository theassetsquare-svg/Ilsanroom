'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

/**
 * ★ 틱톡식 무한 발견 피드 ★
 * 스크롤할수록 새 콘텐츠가 나타남 → 끝이 없음 → 계속 스크롤
 * 콘텐츠 유형을 섞어서 가변보상 효과 (무엇이 나올지 모름)
 */

type FeedItem =
  | { type: 'venue'; venue: Venue }
  | { type: 'tip'; title: string; body: string }
  | { type: 'poll'; question: string; optionA: string; optionB: string }
  | { type: 'fact'; text: string }
  | { type: 'challenge'; text: string };

const TIPS = [
  { title: '첫 방문 꿀팁', body: '처음 가는 곳이라면 평일 수요일~목요일이 가장 여유롭다. 웨이팅 없이 분위기 파악하기 딱 좋음.' },
  { title: '드레스코드 핵심', body: '깔끔한 셔츠에 슬랙스면 어디든 OK. 슬리퍼, 반바지만 아니면 됨. 여성은 원피스 하나면 끝.' },
  { title: '예산 절약 비법', body: '생일이나 기념일이면 미리 말해라. 서비스 음료나 케이크를 주는 곳이 많다.' },
  { title: '좋은 자리 잡는 법', body: '오픈 시간(보통 20~21시)에 가면 좋은 자리 먼저 고를 수 있다. 30분만 일찍 가면 됨.' },
  { title: '혼자 가도 괜찮아', body: '혼자 오는 사람 생각보다 많다. 바 카운터 자리에 앉으면 매니저가 알아서 챙겨줌.' },
  { title: '사진 찍을 때', body: '다른 손님 얼굴은 찍지 마라. 업소 인테리어나 음식만 찍으면 됨. 플래시는 끄고.' },
  { title: '음주 후 귀가', body: '대리운전 번호 미리 저장해둬라. 카카오T 대리가 가장 빠르고, 로지도 괜찮음.' },
  { title: '비가 오면', body: '비 오는 날은 실내 분위기 좋은 라운지가 최고. 조명이 은은해서 비 소리와 잘 어울림.' },
];

const POLLS = [
  { question: '금요일 밤, 어디 갈까?', optionA: '강남 클럽', optionB: '홍대 라운지' },
  { question: '분위기 vs 가성비', optionA: '분위기 최고', optionB: '가성비 최고' },
  { question: '혼자 vs 친구', optionA: '혼자 조용히', optionB: '친구랑 시끌벅적' },
  { question: '음악 취향', optionA: 'EDM/하우스', optionB: '힙합/R&B' },
  { question: '술 vs 안주', optionA: '술이 중요', optionB: '안주가 중요' },
];

const FACTS = [
  '강남 클럽 중 가장 오래된 곳은 줄리아나나이트. 30년 넘게 같은 자리에서 영업 중.',
  '부산 해운대고구려는 룸이 60개가 넘는다. 부산 최대 규모.',
  '일산명월관요정은 한정식 코스가 15가지. 국악 라이브까지 포함.',
  '수원 인계동에는 호빠가 3곳 이상 밀집해있다. 경기도 호빠의 메카.',
  '금요일 밤 10시가 전국 업소 방문자가 가장 많은 시간대.',
  '토요일 새벽 1시에 택시 잡기 가장 힘듦. 미리 대리 예약 추천.',
];

const CHALLENGES = [
  '이번 주 목표: 안 가본 카테고리 1곳 방문하기',
  '친구 3명에게 오늘밤어디 공유하면 VIP 뱃지 획득',
  '리뷰 1개 작성하면 포인트 50점 적립',
  '룰렛 3번 돌리면 숨겨진 업소 추천 해금',
  'VS 투표 5번 참여하면 다음 주 트렌드 미리보기',
];

function getCategoryHref(v: Venue): string {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`,
    night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`,
    hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

export default function InfiniteDiscoveryFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(0);
  const [pollVotes, setPollVotes] = useState<Record<number, string>>({});
  const loaderRef = useRef<HTMLDivElement>(null);
  const openVenues = useMemo(() => venues.filter(v => v.status !== 'closed_or_unclear'), []);

  // Generate mixed feed items
  const generatePage = (pageNum: number): FeedItem[] => {
    const items: FeedItem[] = [];
    const base = pageNum * 6;
    const shuffled = [...openVenues].sort(() => Math.random() - 0.5);

    // Mix content types for variable reward
    for (let i = 0; i < 6; i++) {
      const roll = Math.random();
      if (roll < 0.45 && shuffled[base + i]) {
        items.push({ type: 'venue', venue: shuffled[base + i] });
      } else if (roll < 0.60) {
        items.push({ type: 'tip', ...TIPS[Math.floor(Math.random() * TIPS.length)] });
      } else if (roll < 0.75) {
        items.push({ type: 'poll', ...POLLS[Math.floor(Math.random() * POLLS.length)] });
      } else if (roll < 0.90) {
        items.push({ type: 'fact', text: FACTS[Math.floor(Math.random() * FACTS.length)] });
      } else {
        items.push({ type: 'challenge', text: CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)] });
      }
    }
    return items;
  };

  // Initial load
  useEffect(() => {
    setFeedItems(generatePage(0));
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(prev => {
            const next = prev + 1;
            setFeedItems(old => [...old, ...generatePage(next)]);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  const handleVote = (idx: number, option: string) => {
    setPollVotes(prev => ({ ...prev, [idx]: option }));
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <h2 className="text-xl font-bold text-[#111]">발견 피드</h2>
          <p className="text-sm text-[#555]">스크롤할수록 새로운 발견</p>
        </div>
      </div>

      <div className="space-y-4">
        {feedItems.map((item, idx) => {
          if (item.type === 'venue') {
            return (
              <Link
                key={`v-${idx}`}
                href={getCategoryHref(item.venue)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F0FF] text-lg font-bold text-[#8B5CF6]">
                    {item.venue.nameKo.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-[#111] group-hover:text-[#7c3aed]">{item.venue.nameKo}</p>
                    <p className="mt-1 text-sm text-[#555]">{catLabel[item.venue.category]} · {item.venue.regionKo}</p>
                    <p className="mt-2 text-sm text-[#333] line-clamp-2" style={{ lineHeight: 1.7 }}>{item.venue.shortDescription}</p>
                  </div>
                </div>
              </Link>
            );
          }

          if (item.type === 'tip') {
            return (
              <div key={`t-${idx}`} className="rounded-2xl border border-[#D1FAE5] bg-[#F0FDF4] p-5">
                <p className="mb-1 text-xs font-semibold text-[#059669]">💡 꿀팁</p>
                <p className="text-sm font-bold text-[#111]">{item.title}</p>
                <p className="mt-2 text-sm text-[#333]" style={{ lineHeight: 1.7 }}>{item.body}</p>
              </div>
            );
          }

          if (item.type === 'poll') {
            const voted = pollVotes[idx];
            return (
              <div key={`p-${idx}`} className="rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF] p-5">
                <p className="mb-3 text-sm font-bold text-[#111]">🗳️ {item.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[item.optionA, item.optionB].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleVote(idx, opt)}
                      disabled={!!voted}
                      className={`rounded-xl py-3 text-sm font-medium transition ${
                        voted === opt
                          ? 'bg-[#8B5CF6] text-white'
                          : voted
                            ? 'bg-white/60 text-[#555]'
                            : 'bg-white text-[#333] hover:bg-[#8B5CF6] hover:text-white'
                      }`}
                      style={{ minHeight: 44 }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {voted && <p className="mt-2 text-center text-xs text-[#8B5CF6]">투표 완료! 다음 투표도 참여해보세요</p>}
              </div>
            );
          }

          if (item.type === 'fact') {
            return (
              <div key={`f-${idx}`} className="rounded-2xl border border-[#FEF3C7] bg-[#FFFBEB] p-5">
                <p className="mb-1 text-xs font-semibold text-[#B45309]">📊 알고 계셨나요?</p>
                <p className="text-sm text-[#333]" style={{ lineHeight: 1.7 }}>{item.text}</p>
              </div>
            );
          }

          if (item.type === 'challenge') {
            return (
              <div key={`c-${idx}`} className="rounded-2xl border border-[#FCE7F3] bg-[#FDF2F8] p-5">
                <p className="mb-1 text-xs font-semibold text-[#BE185D]">🎯 이번 주 도전</p>
                <p className="text-sm font-medium text-[#111]">{item.text}</p>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="flex justify-center py-8">
        <div className="flex items-center gap-2 text-sm text-[#555]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
          새로운 콘텐츠 불러오는 중...
        </div>
      </div>
    </section>
  );
}
