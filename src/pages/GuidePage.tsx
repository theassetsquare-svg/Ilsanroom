
import { useState, useEffect } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Link } from 'react-router-dom';
import { PageLiveCounter, GuideReadCount } from '@/components/ui/LiveStats';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';

const guides = [
  {
    category: '클럽',
    icon: '🎵',
    dress: '스마트 캐주얼 (셔츠+슬랙스 or 깔끔한 청바지). 슬리퍼/운동복 입장 제한.',
    budget: '입장료 2~3만 + 음료 1~2만 선. 테이블 예약 시 35~50 비용.',
    alone: '혼자 방문 가능. 바 카운터에서 음료 마시며 느낌 즐기다 댄스플로어 합류.',
    manner: 'DJ 부스 촬영 금지. 다른 사람 촬영 동의 필수. 신분증 필수.',
    bestTime: '금토 23시 이후 피크. 0~2시가 절정.',
  },
  {
    category: '나이트',
    icon: '🌙',
    dress: '세미 포멀~포멀 픽. 정장 또는 셋업이 기본.',
    budget: '입장료 1~3만원 + 양주 1병 10~30만 선. 부스/룸 추가 비용.',
    alone: '웨이터에게 안내 요청하면 부스 배정. 부킹 시스템으로 파트너 매칭.',
    manner: '웨이터 호출 시 손 들기. 부킹 시 예의. 과음 주의.',
    bestTime: '금토 20~21시 입장 추천. 23시 이후 피크.',
  },
  {
    category: '라운지',
    icon: '🍸',
    dress: '스마트 캐주얼 이상. 깔끔하게 입고 가면 돼.',
    budget: '칵테일 1잔 1.5~3만원. 독립 부스 최소 주문 있을 수 있음.',
    alone: '혼자 방문 매우 적합. 바 카운터에서 바텐더와 담소.',
    manner: '조용한 느낌 존중. 큰 소리 자제.',
    bestTime: '평일 저녁 20시 이후. 주말은 미리 예약.',
  },
  {
    category: '룸',
    icon: '🚪',
    dress: '캐주얼~비즈니스 캐주얼. 모임 목적에 맞게.',
    budget: '룸 이용료 + 음료. 매장마다 다름. 전화 문의 필수.',
    alone: '보통 2인 이상 이용. 1인 이용 가능 여부 매장에 확인.',
    manner: '시설 소중히. 퇴실 시간 준수.',
    bestTime: '평일 저녁 회식, 주말 친구 모임.',
  },
  {
    category: '요정',
    icon: '🏮',
    dress: '세미 포멀 이상 필수. 전통 요정의 격조에 맞는 착장.',
    budget: '한정식 코스 20~100만원+. 정찰제 매장 확인.',
    alone: '1인 이용보다 접대/모임 목적. 미리 예약 필수.',
    manner: '전통 문화 존중. 국악 공연 중 조용히.',
    bestTime: '저녁 18~22시. 미리 예약 필수.',
  },
  {
    category: '호빠',
    icon: '🥂',
    dress: '깔끔한 복장이면 충분.',
    budget: '매장마다 다름. 전화 상담 뒤 방문.',
    alone: '혼자 또는 소그룹 입장. 직원이 안내.',
    manner: '직원 존중. 과도한 요구 자제.',
    bestTime: '저녁 21시 이후.',
  },
];

export default function GuidePage() {
  useDocumentMeta('처음이라 긴장된다고? 이거 읽고 가면 프로다', '드레스코드, 예산, 혼자 가도 되는지까지. 업종별 입문 핵심만 정리했다.');
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">첫 방문 완벽 가이드</h1>
      <p className="text-neon-text-muted mb-3">처음 가는 곳이 걱정된다면? 업종별 안내서 여기 있어.</p>

      {/* 살아있는 수치 */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <PageLiveCounter pageName="이 가이드" baseCount={45} />
        <span className="text-gray-300">|</span>
        <span className="text-xs text-gray-400">총 <strong className="text-[#8B5CF6]">8,420</strong>명이 이 가이드로 첫 방문 성공</span>
      </div>

      <div className="space-y-8">
        {guides.map((g) => (
          <div key={g.category} className="rounded-2xl border border-neon-border bg-neon-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neon-text flex items-center gap-2">
                <span className="text-2xl">{g.icon}</span> {g.category} 첫 방문 가이드
              </h2>
              <GuideReadCount category={g.category} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-gold mb-2">복장 규정</h3>
                <p className="text-sm text-neon-text-muted">{g.dress}</p>
              </div>
              <div className="rounded-xl bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-accent mb-2">얼마나 들지?</h3>
                <p className="text-sm text-neon-text-muted">{g.budget}</p>
              </div>
              <div className="rounded-xl bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-green mb-2">혼자 가도 되나?</h3>
                <p className="text-sm text-neon-text-muted">{g.alone}</p>
              </div>
              <div className="rounded-xl bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-pink mb-2">매너/에티켓</h3>
                <p className="text-sm text-neon-text-muted">{g.manner}</p>
              </div>
              <div className="rounded-xl bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-primary-light mb-2">언제 가면 좋지?</h3>
                <p className="text-sm text-neon-text-muted">{g.bestTime}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 실시간 활동 피드 */}
      <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-bold text-gray-500 mb-3">실시간 커뮤니티 활동</p>
        <LiveActivityFeed maxItems={4} interval={8000} />
      </div>

      <div className="mt-8 text-center">
        <Link to="/community" className="inline-flex items-center gap-2 rounded-xl bg-neon-primary px-8 py-4 text-lg font-bold text-white btn-glow transition hover:bg-neon-primary-light">
          커뮤니티에서 추천받기 →
        </Link>
      </div>
    </div>
  );
}
