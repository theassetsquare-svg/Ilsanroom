import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const occasions = [
  {
    id: 'first',
    emoji: '🌱',
    title: '나이트라이프 첫 방문 — 뭐부터 봐야 할지 모를 때',
    desc: '입장 매너·복장·매니저 호칭·예약 흐름까지 처음 가는 사람이 헷갈리는 부분만 정리. 5분 읽으면 어색하지 않게 갈 수 있다.',
    href: '/guide',
    cta: '입문 가이드 확인',
  },
  {
    id: 'after-work',
    emoji: '🍻',
    title: '퇴근하고 한잔 — 회사 끝나고 바로 갈만한 곳',
    desc: '강남·홍대·이태원·일산 회식 후 2차로 좋은 라운지·바·룸 모음. 사람 적어서 자리 잡기 편한 시간대까지 안내.',
    href: '/lounges',
    cta: '퇴근 코스 보러가기',
  },
  {
    id: 'celebrate',
    emoji: '🎉',
    title: '생일·승진 축하 — 친구들이랑 분위기 살리는 곳',
    desc: '단체 부킹·이벤트 챙겨주는 곳, 룸 잡고 깜짝 케이크 가능한 곳 큐레이션. 4-8인 모임 기준 추천.',
    href: '/rooms',
    cta: '축하 자리 찾기',
  },
  {
    id: 'business',
    emoji: '🤝',
    title: '거래처 모실 일 — 비즈니스 자리 깔끔하게',
    desc: 'VIP룸·요정·고급 라운지 위주. 매니저 응대 수준·룸 프라이버시·양주 라인업 검증된 곳만.',
    href: '/yojeong',
    cta: '비즈니스 코스 확인',
  },
  {
    id: 'date',
    emoji: '💜',
    title: '둘이 분위기 잡고 — 대화하기 좋은 자리',
    desc: '조명·음악·좌석 배치 데이트 분위기 좋은 라운지·바 추천. 첫 만남부터 5년차 커플까지.',
    href: '/lounges',
    cta: '데이트 자리 보러가기',
  },
  {
    id: 'solo',
    emoji: '🌙',
    title: '혼자 한잔 — 부담 없이 들렀다 가기',
    desc: '혼술 자연스러운 라운지·바 위주. 처음이라도 어색하지 않게 즐길 수 있는 곳만 추렸다.',
    href: '/lounges',
    cta: '혼술 자리 보기',
  },
];

export default function OccasionPage() {
  useDocumentMeta(
    '어떤 자리야? — 상황별 핫플 큐레이션',
    '나이트라이프 첫 방문? 거래처 접대? 친구 생일? 데이트? 6가지 상황별로 맞는 곳 큐레이션 — 처음 가는 사람도 헛걸음 0번 만들자.'
  );

  return (
    <div className="min-h-screen bg-neon-bg">
      <section className="px-4 py-8 md:py-12 max-w-5xl mx-auto">
        <div className="mb-8">
          <span className="inline-block px-3 py-1 bg-neon-primary text-white text-sm font-bold rounded-full mb-3">
            🎯 상황별 큐레이션
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-neon-text mb-3">
            어떤 자리야? — 6가지 상황별 핫플 정리
          </h1>
          <p className="text-neon-text-muted text-base md:text-lg">
            나한테 맞는 자리부터 찾자. 5초 안에 답 나온다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {occasions.map((o) => (
            <Link
              key={o.id}
              to={o.href}
              className="block bg-neon-surface border border-neon-border rounded-2xl p-6 hover:border-neon-primary card-hover"
            >
              <div className="text-4xl mb-3">{o.emoji}</div>
              <h2 className="text-lg md:text-xl font-bold text-neon-text mb-2">{o.title}</h2>
              <p className="text-sm text-neon-text-muted mb-4 leading-relaxed">{o.desc}</p>
              <span className="inline-block text-sm font-bold text-neon-primary">{o.cta} →</span>
            </Link>
          ))}
        </div>

        <nav className="mt-10 p-5 bg-neon-surface border border-neon-border rounded-xl" aria-label="다른 큐레이션">
          <h2 className="text-base font-bold text-neon-text mb-3">상황 말고 시점·예산으로 골라볼래?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link to="/tonight" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              🌙 오늘 밤 추천 24곳 →
            </Link>
            <Link to="/weekend" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              📅 이번 주말 30곳 →
            </Link>
            <Link to="/budget" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              💼 예산별 코스 4개 →
            </Link>
          </div>
        </nav>

        <div className="mt-6 p-6 bg-neon-surface-2 rounded-xl text-center">
          <p className="text-neon-text font-medium mb-3">아직도 망설인다면 룰렛으로 결정</p>
          <Link
            to="/roulette"
            className="inline-block px-6 py-3 bg-neon-primary text-white rounded-full font-bold hover:bg-neon-primary-light"
          >
            🎰 즉석 추천 받기
          </Link>
        </div>
      </section>
    </div>
  );
}
