import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/* 가격 노출 금지 (CLAUDE.md). 예산 분류는 "분위기·구성·코스" 기준 큐레이션만 제공 */
const tiers = [
  {
    id: 'casual',
    title: '편하게 한잔 — 부담 없이 들렀다 가기 좋은 곳',
    desc: '퇴근 후 1-2시간, 양주 한 잔에 가볍게 즐기는 라운지·바 위주. 처음이라도 어색하지 않은 분위기.',
    href: '/lounges',
    emoji: '🍷',
    cta: '가벼운 자리 보러가기',
  },
  {
    id: 'group',
    title: '친구들이랑 단체로 — 4-6인 어울리기 좋은 코스',
    desc: '룸·나이트 위주, 단체 부킹·코스 짜기 편한 곳 추천. 생일·환영회 분위기 살리기 좋다.',
    href: '/rooms',
    emoji: '🥂',
    cta: '단체 가능한 곳 보기',
  },
  {
    id: 'premium',
    title: '제대로 모실 일 — VIP룸·요정·프리미엄 코스',
    desc: '거래처 접대, 중요한 만남용 프리미엄 코스. 매니저 응대 좋은 곳, 양주 라인업 풍부한 곳 큐레이션.',
    href: '/yojeong',
    emoji: '🏮',
    cta: '프리미엄 코스 확인',
  },
  {
    id: 'date',
    title: '둘이 분위기 잡고 — 조용히 대화하기 좋은 자리',
    desc: '라운지·바 중심, 음악 적당하고 조명 좋은 곳. 처음 만나는 자리에도 어색하지 않다.',
    href: '/lounges',
    emoji: '🌙',
    cta: '데이트 자리 찾기',
  },
];

export default function BudgetPage() {
  useDocumentMeta(
    '상황별 추천 — 어떤 자리를 찾고 있나?',
    '편한 자리? 단체? 접대? 데이트? 상황별로 분위기·구성 맞는 곳 4가지 코스로 정리. 처음이라 어디부터 봐야 할지 모르면 바로 확인.'
  );

  return (
    <div className="min-h-screen bg-neon-bg">
      <section className="px-4 py-8 md:py-12 max-w-5xl mx-auto">
        <div className="mb-8">
          <span className="inline-block px-3 py-1 bg-neon-accent text-white text-sm font-bold rounded-full mb-3">
            💡 처음이라면 이거부터
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-neon-text mb-3">
            어떤 자리를 찾고 있나? — 상황별 코스 4가지
          </h1>
          <p className="text-neon-text-muted text-base md:text-lg">
            가격은 매장마다 다르니까 분위기·구성으로 골랐다. 망설이지 말고 한 번에 정해보자.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiers.map((t) => (
            <Link
              key={t.id}
              to={t.href}
              className="block bg-neon-surface border border-neon-border rounded-2xl p-6 hover:border-neon-primary card-hover"
            >
              <div className="text-4xl mb-3">{t.emoji}</div>
              <h2 className="text-lg md:text-xl font-bold text-neon-text mb-2">{t.title}</h2>
              <p className="text-sm text-neon-text-muted mb-4 leading-relaxed">{t.desc}</p>
              <span className="inline-block text-sm font-bold text-neon-primary">
                {t.cta} →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 p-6 bg-neon-surface-2 rounded-xl">
          <p className="text-neon-text font-bold mb-3">📌 잠깐, 알아두면 좋은 것</p>
          <ul className="text-sm text-neon-text-muted space-y-2 leading-relaxed">
            <li>· 매장별 양주·룸 구성은 상세 페이지에서 한 번 더 확인하자</li>
            <li>· 예약은 전화 한 통이 빠르다 — 매장 페이지 전화 버튼 활용</li>
            <li>· 첫 방문이면 평일 저녁이 사람 적어서 분위기 살피기 좋다</li>
          </ul>
        </div>

        <nav className="mt-6 p-5 bg-neon-surface border border-neon-border rounded-xl" aria-label="다른 큐레이션">
          <h2 className="text-base font-bold text-neon-text mb-3">상황 말고 시점으로 골라볼래?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link to="/tonight" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              🌙 오늘 밤 추천 24곳 →
            </Link>
            <Link to="/weekend" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              📅 이번 주말 30곳 →
            </Link>
            <Link to="/occasion" className="block px-4 py-3 bg-neon-surface-2 hover:bg-neon-bg rounded-lg text-sm text-neon-text">
              🎯 상황별 6가지 →
            </Link>
          </div>
        </nav>
      </section>
    </div>
  );
}
