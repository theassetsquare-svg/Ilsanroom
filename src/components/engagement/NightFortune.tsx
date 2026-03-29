/**
 * NightFortune — 밤문화 운세 위젯
 *
 * 오늘 날짜 기반 결정론적 운세를 보여줍니다.
 * 분위기운, 만남운, 금전운, 행운지수 4개 카테고리 + 럭키 업종 추천.
 */

const VENUE_CATEGORIES = ['클럽', '나이트', '라운지', '룸', '요정', '호빠'] as const;

const FORTUNE_MESSAGES = [
  '오늘 밤은 당신이 주인공! 자신감을 가지세요.',
  '예상치 못한 인연이 기다리고 있을지도 몰라요.',
  '지갑은 닫고 매력은 열어두세요.',
  '분위기 메이커가 되는 날, 모두가 당신을 주목합니다.',
  '조용한 곳에서 깊은 대화가 행운을 부릅니다.',
  '오늘은 새로운 곳을 개척하면 대박!',
  '친구와 함께하면 행운이 두 배가 되는 밤.',
  '첫인상이 결정적인 날, 스타일에 신경 쓰세요.',
  '늦게 갈수록 좋은 일이 생기는 밤이에요.',
  '오늘의 키워드는 "여유". 급하지 않게 즐기세요.',
  '음악에 몸을 맡기면 행운이 따라옵니다.',
  '웃음이 비밀 무기가 되는 날입니다.',
];

/** 날짜 기반 시드로 결정론적 난수 생성 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getTodaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function getStars(score: number): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

export default function NightFortune() {
  const seed = getTodaySeed();
  const rand = seededRandom(seed);

  const mood = Math.floor(rand() * 5) + 1;       // 분위기운 1-5
  const social = Math.floor(rand() * 5) + 1;     // 만남운 1-5
  const money = Math.floor(rand() * 5) + 1;      // 금전운 1-5
  const luck = Math.floor(rand() * 5) + 1;       // 행운지수 1-5

  const luckyVenue = VENUE_CATEGORIES[Math.floor(rand() * VENUE_CATEGORIES.length)];
  const message = FORTUNE_MESSAGES[Math.floor(rand() * FORTUNE_MESSAGES.length)];

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  const categories = [
    { label: '분위기운', score: mood },
    { label: '만남운', score: social },
    { label: '금전운', score: money },
    { label: '행운지수', score: luck },
  ];

  return (
    <div className="rounded-2xl border border-purple-400/60 bg-gradient-to-br from-[#1a1025] to-[#2d1b4e] p-5 shadow-lg">
      {/* Header */}
      <div className="mb-4 text-center">
        <p className="text-sm font-semibold text-amber-400 tracking-wider mb-1">
          {dateLabel} 운세
        </p>
        <h3 className="text-xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
          밤문화 운세
        </h3>
      </div>

      {/* Fortune categories */}
      <div className="space-y-2.5 mb-4">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-white w-20">{cat.label}</span>
            <span className="text-base tracking-wider text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]">
              {getStars(cat.score)}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-purple-400/40 my-4" />

      {/* Lucky venue */}
      <div className="text-center mb-3">
        <p className="text-sm font-medium text-purple-100 mb-1.5">오늘의 럭키 업종</p>
        <span className="inline-block rounded-full bg-purple-600/30 border border-purple-400/60 px-4 py-1.5 text-base font-extrabold text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]">
          {luckyVenue}
        </span>
      </div>

      {/* Fortune message */}
      <p className="text-center text-[15px] font-medium text-white/90 leading-relaxed">
        {message}
      </p>
    </div>
  );
}
