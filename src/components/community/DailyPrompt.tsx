import { Link } from '../ui/SafeLink';

// 30개 사람 톤 글감 — 매일 결정적 회전 (KST 기준 day-of-year % 30)
// 시드 난수 X, 가짜 통계 X. 단순 회전 = 모든 회원이 같은 날 같은 글감
const PROMPTS = [
  '어제 갔다 온 곳, 솔직히 어땠어?',
  '이번 주말 갈 만한 곳 추천 좀 받자',
  '처음 가는데 미리 뭐 알고 가야 돼?',
  '줄 안 서고 들어가는 방법 있나',
  '혼자 가도 어색하지 않은 곳 알려줘',
  '술 약한 편인데 갈만한 분위기 있을까',
  '친구 생일 챙겨주려는데 어디가 좋을까',
  '강남 vs 홍대, 너네 선택은?',
  '평일에 갔는데 의외로 자리 있더라 — 어디 가봤어',
  '드레스코드 빡센 곳 어디야',
  '분위기 진짜 좋은 라운지 추천 좀',
  '첫 방문 후기, 솔직히 적응 어려웠어?',
  '단골 되면 뭐가 달라져?',
  'MD나 실장 잘 만나는 법 있어?',
  '야경 좋은 라운지 어디 있어',
  '새벽까지 영업하는 곳 알려줘',
  '비 오는 날 가기 좋은 곳 있나',
  '편하게 입고 갈 만한 곳 추천',
  '친구가 처음 같이 가자는데 어디로 데려갈까',
  '부킹 안 당하는 노하우 좀',
  '양주 처음 시켜보는데 뭐가 좋아',
  '룸 vs 라운지 어느 쪽이 더 편해?',
  '셔틀 운영하는 곳 있어?',
  '회원 등급 같은 거 챙겨주는 곳 있나',
  '사람 진짜 많은 시간대는 언제야',
  '분위기 망친 적 있어? 어떤 상황이었는데',
  '다녀온 곳 중 다시는 안 갈 데 있어?',
  '가게 분위기 빨리 파악하는 팁',
  '친구랑 의견 갈렸을 때 어디로 결정해?',
  '오늘 밤 누구랑 갈래? 한 줄 자랑',
];

function getKSTDayOfYear(): number {
  const now = new Date();
  // UTC + 9h = KST
  const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
  const start = new Date(kstNow.getFullYear(), 0, 0);
  const diff = kstNow.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export default function DailyPrompt() {
  const prompt = PROMPTS[getKSTDayOfYear() % PROMPTS.length];

  return (
    <div
      className="mb-8 rounded-2xl border-2 border-amber-200 p-5 sm:p-6"
      style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-lg">📝</span>
        <span
          className="text-xs font-bold rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: '#FCD34D', color: '#92400E' }}
        >
          오늘의 글감
        </span>
        <span className="text-xs" style={{ color: '#92400E' }}>
          매일 자정에 바뀜
        </span>
      </div>
      <p
        className="text-base sm:text-lg font-bold mb-4"
        style={{ color: '#78350F', lineHeight: '1.6' }}
      >
        “{prompt}”
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/community/free"
          className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 transition"
          style={{ minHeight: 36 }}
        >
          한 줄 써보기 →
        </Link>
        <Link
          to="/community/qna"
          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-50 transition"
          style={{ minHeight: 36 }}
        >
          질문으로 올리기
        </Link>
      </div>
    </div>
  );
}
