import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '첫 방문 가이드 | 일산룸포털 — 처음 가는 사람 완벽 가이드',
  description: '클럽, 나이트, 라운지, 룸, 요정, 호빠 처음 방문자를 위한 완벽 가이드. 복장, 예산, 매너, 혼자 가도 되는지까지.',
};

const guides = [
  {
    category: '클럽',
    icon: '🎵',
    dress: '스마트 캐주얼 (셔츠+슬랙스 or 깔끔한 청바지). 슬리퍼/운동복 입장 제한.',
    budget: '입장료 2~3만원 + 음료 1~2만원. 테이블 예약 시 35~50만원+.',
    alone: '혼자 방문 가능. 바 카운터에서 음료 마시며 분위기 즐기다 댄스플로어 합류.',
    manner: 'DJ 부스 촬영 금지. 다른 사람 촬영 동의 필수. 신분증 필수.',
    bestTime: '금토 23시 이후 피크. 0~2시가 절정.',
  },
  {
    category: '나이트',
    icon: '🌙',
    dress: '세미 포멀~포멀 권장. 정장 또는 셋업이 기본.',
    budget: '입장료 1~3만원 + 양주 1병 10~30만원. 부스/룸 추가 비용.',
    alone: '웨이터에게 안내 요청하면 부스 배정. 부킹 시스템으로 파트너 매칭.',
    manner: '웨이터 호출 시 손 들기. 부킹 시 예의. 과음 주의.',
    bestTime: '금토 20~21시 입장 추천. 23시 이후 피크.',
  },
  {
    category: '라운지',
    icon: '🍸',
    dress: '스마트 캐주얼 이상. 세련된 복장 권장.',
    budget: '칵테일 1잔 1.5~3만원. 프라이빗 부스 최소 주문 있을 수 있음.',
    alone: '혼자 방문 매우 적합. 바 카운터에서 바텐더와 대화.',
    manner: '조용한 분위기 존중. 큰 소리 자제.',
    bestTime: '평일 저녁 20시 이후. 주말은 사전 예약.',
  },
  {
    category: '룸',
    icon: '🚪',
    dress: '캐주얼~비즈니스 캐주얼. 모임 목적에 맞게.',
    budget: '룸 이용료 + 음료. 업소마다 다름. 사전 전화 문의.',
    alone: '보통 2인 이상 이용. 1인 이용 가능 여부 업소에 확인.',
    manner: '시설 소중히. 퇴실 시간 준수.',
    bestTime: '평일 저녁 회식, 주말 친구 모임.',
  },
  {
    category: '요정',
    icon: '🏮',
    dress: '세미 포멀 이상 필수. 전통 요정의 격조에 맞는 복장.',
    budget: '한정식 코스 20~100만원+. 정찰제 업소 확인.',
    alone: '1인 이용보다 접대/모임 목적. 사전 예약 필수.',
    manner: '전통 문화 존중. 국악 공연 중 조용히.',
    bestTime: '저녁 18~22시. 사전 예약 필수.',
  },
  {
    category: '호빠',
    icon: '🥂',
    dress: '깔끔한 복장이면 충분.',
    budget: '업소마다 다름. 사전 전화 상담 권장.',
    alone: '혼자 또는 소그룹 방문. 직원이 안내.',
    manner: '직원 존중. 과도한 요구 자제.',
    bestTime: '저녁 21시 이후.',
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">첫 방문 완벽 가이드</h1>
      <p className="text-neon-text-muted mb-10">처음 가는 곳이 걱정된다면? 업종별 가이드를 확인하세요.</p>

      <div className="space-y-8">
        {guides.map((g) => (
          <div key={g.category} className="rounded-2xl border border-neon-border bg-neon-surface p-6">
            <h2 className="text-xl font-bold text-neon-text mb-4 flex items-center gap-2">
              <span className="text-2xl">{g.icon}</span> {g.category} 첫 방문 가이드
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-neon-bg p-4">
                <h3 className="text-xs font-bold text-neon-gold mb-2">뭐 입고 가지?</h3>
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

      <div className="mt-12 text-center">
        <Link href="/quiz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-neon-primary px-8 py-4 text-lg font-bold text-white btn-glow transition hover:bg-neon-primary-light">
          나에게 맞는 곳 찾기 퀴즈 →
        </Link>
      </div>
    </div>
  );
}
