import { useState } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { captureLead, isValidEmail } from '@/lib/growth-engine';

const REGIONS = [
  {
    name: '강남/청담',
    venues: [
      { name: '클럽 레이스', type: '클럽', tip: '금토 자정 이후 입장 시 대기 최소 40분. 11시 전 도착 필수. 드레스코드 엄격 — 운동화 절대 불가.', price: '남 3~5만 / 여 무료~2만', dress: '세미정장, 힐 필수' },
      { name: '아레나', type: '클럽', tip: 'EDM 중심. 금요일보다 토요일이 분위기 더 좋다는 평이 많음. 테이블 예약하면 대기 패스.', price: '남 3~5만 / 여 무료~1만', dress: '캐주얼 OK, 슬리퍼 불가' },
      { name: '퍼스트 라운지', type: '라운지', tip: '조용한 대화 원하면 평일 추천. 주말엔 DJ 타임 있어서 라운지보다 클럽 분위기.', price: '1인 5~8만', dress: '스마트캐주얼' },
    ],
  },
  {
    name: '홍대/이태원',
    venues: [
      { name: '클럽 피스틴', type: '클럽', tip: '힙합 중심 클럽. 목요일 레이디스 나잇은 여성 무료입장 + 음료 1잔. 현지인 비율 높은 날.', price: '남 2~3만 / 여 무료~1만', dress: '자유' },
      { name: '카페 사운드', type: '바', tip: '라이브 재즈 공연 매주 수금. 공연 없는 날은 조용한 칵테일바. 2층 테라스 야경이 포인트.', price: '칵테일 1.5~2만', dress: '자유' },
      { name: '하드록 이태원', type: '펍', tip: '외국인 비율 70%. 영어 메뉴 완비. 금요일 밤 10시부터 DJ. 버거가 의외로 맛있음.', price: '맥주 8~12천', dress: '자유' },
    ],
  },
  {
    name: '일산/파주',
    venues: [
      { name: '일산룸', type: '룸', tip: '신실장 직접 관리. 단체 회식에 최적화. 예약 필수 — 당일 방문 시 대기 1시간 이상.', price: '인당 5~10만', dress: '자유' },
      { name: '웨스턴돔 라운지', type: '라운지', tip: '일산 유일 루프탑 라운지. 여름 시즌 테라스 인기 폭발. 겨울에는 실내만 운영.', price: '칵테일 1.5~2.5만', dress: '스마트캐주얼' },
      { name: '밤리단길 포차', type: '포차', tip: '후정역 3번출구. 테이블 회전 빠른 편. 안주 양이 많아서 2명이 3개면 충분.', price: '인당 2~4만', dress: '자유' },
    ],
  },
  {
    name: '수원/분당',
    venues: [
      { name: '영통 펍스트리트', type: '펍', tip: '대학가라 20대 초반 비율 높음. 목금이 피크. 토요일은 의외로 조용한 편.', price: '맥주 5~8천', dress: '자유' },
      { name: '분당 라운지W', type: '라운지', tip: '30대 직장인 비율 높음. 평일 와인 할인 이벤트. 주차 편리한 게 최대 장점.', price: '와인 글라스 1.5~2만', dress: '비즈니스캐주얼' },
      { name: '인계동 클럽존', type: '클럽', tip: '수원 최대 클럽 밀집 지역. 금요일 밤 11시부터 본격 시작. 택시 잡기 어려우니 대리 미리 예약.', price: '남 2~3만 / 여 무료', dress: '캐주얼' },
    ],
  },
];

export default function NightlifeGuidePage() {
  useDocumentMeta(
    '서울경기 나이트라이프 완벽 가이드 — 현지인만 아는 진짜 핫플',
    '서울 경기 나이트라이프 현지인 추천 가이드. 강남 홍대 이태원 일산 클럽 라운지 바 드레스코드 무드 인사이더 팁 총정리.'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (!isValidEmail(email)) { setError('올바른 이메일을 입력해주세요.'); return; }

    setLoading(true);
    await captureLead({ name, email, source: 'nightlife-guide' });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">
          서울/경기 나이트라이프 완벽 가이드
        </h1>
        <p className="mb-2 text-lg text-neon-muted">
          현지인만 아는 진짜 핫플. 관광객용 리스트가 아닌, 매주 밤을 즐기는 사람들의 솔직한 추천.
        </p>
        <p className="text-sm text-neon-muted">
          드레스코드부터 무드, 최적 방문 시간까지 — 이 가이드 하나면 어디서든 실패 없는 밤.
        </p>
      </section>

      {/* Lead capture form */}
      {!submitted ? (
        <section className="mx-auto mb-12 max-w-md rounded-2xl border border-neon-primary/20 bg-neon-surface p-6 shadow-lg">
          <h2 className="mb-2 text-center text-xl font-bold">무료 가이드 다운로드</h2>
          <p className="mb-4 text-center text-sm text-neon-muted">
            이메일로 전체 가이드 PDF + 매주 업데이트되는 핫플 리스트를 받아보세요.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-4 py-3 text-base outline-none focus:border-neon-primary"
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-4 py-3 text-base outline-none focus:border-neon-primary"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neon-primary px-4 py-3 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '무료 가이드 받기'}
            </button>
          </form>
          <p className="mt-3 text-center text-xs text-neon-muted">스팸 없음. 언제든 구독 취소 가능.</p>
        </section>
      ) : (
        <section className="mx-auto mb-12 max-w-md rounded-2xl border border-green-500/20 bg-green-50 p-6 text-center">
          <div className="mb-2 text-4xl">✅</div>
          <h2 className="mb-2 text-xl font-bold text-green-800">가이드가 이메일로 전송되었습니다!</h2>
          <p className="text-sm text-green-700">
            {name}님, 받은 편지함을 확인해주세요. 매주 금요일 핫플 업데이트도 함께 받아보실 수 있습니다.
          </p>
        </section>
      )}

      {/* Preview content */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">지역별 TOP 추천</h2>
        {REGIONS.map((region) => (
          <div key={region.name} className="mb-8">
            <h3 className="mb-4 text-xl font-bold text-neon-primary">{region.name}</h3>
            <div className="space-y-4">
              {region.venues.map((venue) => (
                <div
                  key={venue.name}
                  className="rounded-xl border border-neon-border bg-neon-surface p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-neon-primary/10 px-2 py-0.5 text-xs font-medium text-neon-primary">
                      {venue.type}
                    </span>
                    <h4 className="font-bold">{venue.name}</h4>
                  </div>
                  <p className="mb-2 text-sm leading-relaxed text-neon-muted">{venue.tip}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-neon-muted">
                    <span>💰 {venue.price}</span>
                    <span>👔 {venue.dress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      {!submitted && (
        <section className="rounded-2xl bg-gradient-to-r from-neon-primary to-purple-700 p-8 text-center text-white">
          <h2 className="mb-2 text-2xl font-bold">더 많은 숨겨진 업소가 궁금하다면?</h2>
          <p className="mb-4 text-sm opacity-90">
            위 리스트는 맛보기입니다. 전체 가이드에는 50곳 이상의 현지인 추천 업소와 시즌별 이벤트 정보가 포함되어 있습니다.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="rounded-lg bg-white px-6 py-3 font-bold text-neon-primary transition hover:opacity-90"
          >
            무료 가이드 받으러 가기 ↑
          </button>
        </section>
      )}
    </div>
  );
}
