
import { useState, useEffect, useRef, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { usePageBlock } from '@/hooks/usePageBlock';
import { VENUES_TOTAL_OPEN, VENUES_BY_CATEGORY } from '@/data/venues-counts';
import { VENUES_TOP4 } from '@/data/venues-top4';
import type { Venue } from '@/types';
import { createClient } from '@/lib/supabase';
import JsonLd from '@/components/seo/JsonLd';
import { useFavorites as useFavoritesHook } from '@/hooks/useFavorites';
// 아래로 접힌 무거운 위젯들은 lazy — TBT(메인 스레드 블로킹) 감소가 목적.
// 모두 above-the-fold 아래에 위치 → LCP/FCP 영향 0.
const HomeFeed = lazy(() => import('@/components/community/HomeFeed').then(m => ({ default: m.HomeFeed })));
const TemperatureRanking = lazy(() => import('@/components/community/TemperatureRanking').then(m => ({ default: m.TemperatureRanking })));
const LiveActivityFeed = lazy(() => import('@/components/ui/LiveActivityFeed'));
const TrendingTodayWidget = lazy(() => import('@/components/widgets/TrendingTodayWidget'));
const RecentlyUpdatedWidget = lazy(() => import('@/components/widgets/RecentlyUpdatedWidget'));
const LiveStats = lazy(() => import('@/components/live/LiveStats'));
const FreshPostsZone = lazy(() => import('@/components/home/FreshPostsZone'));
const StreakBadge = lazy(() => import('@/components/home/StreakBadge'));
const PrivacyTrustBadge = lazy(() => import('@/components/privacy/PrivacyTrustBadge'));
const OpenBetaBanner = lazy(() => import('@/components/launch/OpenBetaBanner'));
const InviteFriendBox = lazy(() => import('@/components/launch/InviteFriendBox'));
const InfiniteRecommendLoop = lazy(() => import('@/components/home/InfiniteRecommendLoop'));
const LuckyRoulette = lazy(() => import('@/components/home/LuckyRoulette'));
import { articles as magazineArticles } from '@/data/magazine-articles';
import { useAuth } from '@/hooks/useAuth';

/* ── Helpers ── */
function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };
const catHrefs: Record<string, string> = { club: '/clubs', night: '/nights', lounge: '/lounges', room: '/rooms', yojeong: '/yojeong', hoppa: '/hoppa' };

/* ── Region labels for 지역별 tab filter ── */
const regionLabels = ['전체', '강남', '압구정', '홍대', '이태원', '부산', '대구', '광주', '대전', '수원', '일산', '인천', '성남', '천안', '울산'];

const allSeedJogak: JogakItem[] = [
  { id: 'sj-1', title: '금요일 홍대 버뮤다 같이 갈 사람', region: '홍대', gender: '혼성', current: 2, max: 4, time: '이번 금요일 23:00' },
  { id: 'sj-2', title: '강남 레이스 테이블 엔빵 모집', region: '강남', gender: '남녀무관', current: 3, max: 6, time: '토요일 22:00' },
  { id: 'sj-3', title: '부산 고구려 주말 조각 급구', region: '해운대', gender: '혼성', current: 4, max: 8, time: '금요일 21:00' },
  { id: 'sj-4', title: '수원 찬스돔 평일 벙개 갈 사람!!', region: '수원', gender: '누구나', current: 1, max: 3, time: '목요일 23:30' },
  { id: 'sj-5', title: '대전 나이트 주말 같이 가실 분', region: '대전', gender: '혼성', current: 2, max: 5, time: '토요일 21:00' },
  { id: 'sj-6', title: '일산 라붐 이번주 ㄱㄱ 2명 더 구함', region: '일산', gender: '혼성', current: 3, max: 5, time: '금요일 22:00' },
  { id: 'sj-7', title: '강남 호빠 첫방문 같이 갈 여자분!!', region: '강남', gender: '여성', current: 1, max: 3, time: '토요일 20:00' },
  { id: 'sj-8', title: '대구 나이트 주말 급구!!', region: '대구', gender: '남녀무관', current: 2, max: 4, time: '토요일 22:00' },
  { id: 'sj-9', title: '이태원 라운지 소규모 모임', region: '이태원', gender: '혼성', current: 2, max: 4, time: '금요일 21:30' },
  { id: 'sj-10', title: '인천 주말 나이트 크루 모집중', region: '인천', gender: '누구나', current: 3, max: 6, time: '토요일 21:00' },
];
// 조각모임도 회전
function getSeedJogak(): JogakItem[] {
  const d = new Date();
  const seed = d.getDate() + Math.floor(d.getHours() / 6);
  const result: JogakItem[] = [];
  for (let i = 0; i < 5; i++) result.push(allSeedJogak[(seed + i) % allSeedJogak.length]);
  return result;
}
const seedJogakList = getSeedJogak();

/* ── 지금 뜨는 토론 — 논쟁 유발해서 클릭 + 댓글 유도 ── */
const allSeedDebates = [
  { id: 'db-1', topic: '클럽 vs 나이트, 진짜 만남 확률 높은 곳은?', heat: 89, side: ['클럽이지', '나이트 압승'], comments: 47 },
  { id: 'db-2', topic: '강남 vs 홍대, 분위기는 어디가 나아?', heat: 76, side: ['강남이 강남', '홍대가 진짜'], comments: 31 },
  { id: 'db-3', topic: '혼자 가면 진짜 눈치 보여? 솔직하게', heat: 92, side: ['상관없음', '좀 그렇지..'], comments: 58 },
  { id: 'db-4', topic: '룸 vs 오픈 테이블, 접대는 어디서?', heat: 67, side: ['룸이 답', '오픈이 분위기'], comments: 22 },
  { id: 'db-5', topic: '금요일밤 vs 토요일밤, 언제가 더 미쳤어?', heat: 83, side: ['불금이지', '토요일 진짜'], comments: 39 },
  { id: 'db-6', topic: '호빠 처음인데 뭐 입고 가야함?', heat: 71, side: ['캐주얼 OK', '꾸며야지'], comments: 44 },
  { id: 'db-7', topic: '나이트 부킹 vs 클럽 헌팅, 뭐가 더 자연스러움?', heat: 85, side: ['부킹 편함', '헌팅이 진짜'], comments: 52 },
  { id: 'db-8', topic: '양주 vs 맥주, 분위기 잡으려면?', heat: 74, side: ['양주 한병이면 끝', '맥주가 편해'], comments: 33 },
  { id: 'db-9', topic: '서울 vs 지방 나이트, 수준 차이 있음?', heat: 91, side: ['서울이 다름', '지방도 꿀잼'], comments: 61 },
  { id: 'db-10', topic: '나이트 갈 때 향수 뿌려야함 말아야함?', heat: 68, side: ['필수임', '자연이 최고'], comments: 29 },
  { id: 'db-11', topic: '클럽 새벽 1시 vs 11시, 갈 타이밍은?', heat: 79, side: ['새벽이 진짜', '일찍 가야 자리'], comments: 37 },
  { id: 'db-12', topic: '혼술 후 나이트 vs 처음부터 나이트?', heat: 72, side: ['한잔 하고가', '맨정신이 나음'], comments: 41 },
  { id: 'db-13', topic: '라운지 데이트 vs 레스토랑 데이트?', heat: 81, side: ['라운지가 분위기', '밥이 먼저지'], comments: 48 },
  { id: 'db-14', topic: '택시 vs 대리, 새벽 귀가 어떻게 함?', heat: 65, side: ['택시 무조건', '대리가 편해'], comments: 26 },
  { id: 'db-15', topic: '요정 가봄? 솔직히 어때?', heat: 88, side: ['인생 바뀜', '생각보다 그냥'], comments: 55 },
];
// 토론도 시간별 회전
function getSeedDebates() {
  const d = new Date();
  const seed = d.getDate() * 3 + Math.floor(d.getHours() / 4);
  const result = [];
  for (let i = 0; i < 6; i++) result.push(allSeedDebates[(seed + i) % allSeedDebates.length]);
  return result;
}
const seedDebates = getSeedDebates();

/* ── 무한 추천 문구 — 끝없는 탐색 유도 ── */
const nextHooks = [
  '이것도 볼래?', '다른 데도 궁금하지?', '여기는 가봤어?',
  '아직 안 봤지?', '이건 진짜 숨은 맛집', '사람들이 찜한 곳',
];

/* ── VS Polls — 매일 다른 투표 3세트 ── */
const vsPolls = [
  { q: '강남 양대산맥! 어디가 더 미쳤어?', a: '레이스', b: '아르쥬', aEmoji: '🔥', bEmoji: '💎', aPct: 54, bPct: 46 },
  { q: '금요일 밤, 뭐가 더 끌려?', a: '클럽', b: '나이트', aEmoji: '🎵', bEmoji: '🌙', aPct: 61, bPct: 39 },
  { q: '혼자 가도 괜찮은 곳은?', a: '라운지', b: '나이트', aEmoji: '🍸', bEmoji: '💃', aPct: 67, bPct: 33 },
  { q: '첫 방문이면 어디부터?', a: '홍대', b: '강남', aEmoji: '🎨', bEmoji: '💰', aPct: 48, bPct: 52 },
  { q: '분위기 vs 가격, 뭐가 더 중요?', a: '분위기', b: '가격', aEmoji: '✨', bEmoji: '💵', aPct: 72, bPct: 28 },
  { q: '단체 모임, 어디가 찐이야?', a: '룸', b: '호빠', aEmoji: '🚪', bEmoji: '🥂', aPct: 58, bPct: 42 },
  { q: '주말 새벽 2시, 아직 놀고 싶다면?', a: '클럽', b: '요정', aEmoji: '🎶', bEmoji: '🏮', aPct: 63, bPct: 37 },
];

/* ── Fortune — 더 풍부하고 재미있는 밤 운세 ── */
const allFortunes = [
  { emoji: '🔥', title: '불꽃 에너지', text: '오늘 밤은 당신이 주인공. 입장 순간부터 시선 집중.', lucky: '강남 클럽', luckyColor: '레드', luckyNum: 7, tip: '첫 곡이 나올 때 플로어 앞줄로 가라. 운명이 바뀐다.' },
  { emoji: '💃', title: '인연의 밤', text: '새로운 만남의 별이 빛난다. 눈이 마주치면 먼저 웃어라.', lucky: '나이트', luckyColor: '핑크', luckyNum: 3, tip: '혼자 갈수록 더 좋은 인연이 온다. 믿어라.' },
  { emoji: '🍸', title: '고급 취향', text: '조용한 대화가 통하는 밤. 분위기로 승부하라.', lucky: '라운지', luckyColor: '골드', luckyNum: 9, tip: '칵테일 한 잔의 여유가 오늘 밤을 결정한다.' },
  { emoji: '🎶', title: '리듬 마스터', text: '리듬을 타면 모든 게 풀린다. 몸이 먼저 아는 밤.', lucky: '클럽', luckyColor: '퍼플', luckyNum: 5, tip: 'DJ가 바뀌는 타임에 가면 최고의 셋을 만난다.' },
  { emoji: '✨', title: '탐험가의 밤', text: '안 가본 곳이 행운이다. 새로운 도전이 대박의 시작.', lucky: '신규 업소', luckyColor: '블루', luckyNum: 1, tip: '친구가 추천한 곳 말고, 니 직감을 믿어라.' },
  { emoji: '🥂', title: '인싸력 만렙', text: '사람이 모이는 곳에 니가 있다. 오늘은 단체전이 답.', lucky: '호빠', luckyColor: '로즈골드', luckyNum: 8, tip: '3명 이상이면 분위기 장악 가능. 크루를 소집하라.' },
  { emoji: '🌙', title: '새벽형 인간', text: '밤이 깊을수록 좋아진다. 새벽 타임이 진짜 시작.', lucky: '새벽 영업', luckyColor: '네이비', luckyNum: 2, tip: '자정 넘어서 도착하면 VIP 대우를 받는다.' },
  { emoji: '🎭', title: '변신의 밤', text: '평소와 다른 스타일을 시도하라. 오늘 밤은 반전이다.', lucky: '요정', luckyColor: '에메랄드', luckyNum: 6, tip: '드레스 코드를 한 단계 올리면 대접이 달라진다.' },
  { emoji: '💎', title: '럭셔리 운', text: '오늘은 좋은 곳에 가야 한다. 아끼지 마라, 돌아온다.', lucky: '고급 업소', luckyColor: '다이아', luckyNum: 4, tip: '테이블 예약하면 3배 더 즐긴다. 투자하라.' },
  { emoji: '🎪', title: '파티 본능', text: '음악이 커질수록 기분이 올라간다. 미친 듯이 놀아라.', lucky: '클럽', luckyColor: '네온그린', luckyNum: 11, tip: '혼자 춤추는 사람이 가장 멋있다. 눈치 보지 마라.' },
];

/* ── 미니 성향테스트 — 3탭으로 /quiz 유도 ── */
const miniQuizQuestions = [
  { q: '오늘 밤 기분은?', opts: [{ emoji: '🔥', label: '미친듯이 놀고싶다', result: 'club' }, { emoji: '🍸', label: '조용히 한잔', result: 'lounge' }, { emoji: '💃', label: '새로운 만남', result: 'night' }] },
  { q: '누구랑 갈 거야?', opts: [{ emoji: '👥', label: '친구들이랑', result: 'club' }, { emoji: '🤝', label: '거래처 접대', result: 'room' }, { emoji: '🙋', label: '혼자 가도 OK', result: 'lounge' }] },
  { q: '분위기 취향은?', opts: [{ emoji: '🎶', label: 'EDM 쿵쿵', result: 'club' }, { emoji: '🏮', label: '격 있는 전통', result: 'yojeong' }, { emoji: '🥂', label: '화끈한 서비스', result: 'hoppa' }] },
];

/* ── 카테고리별 드림고객 카피 (클릭 유도용) ── */
const dreamCustomerCopy: Record<string, { hook: string; painPoint: string; cta: string }> = {
  club: { hook: '줄 안 서는 클럽 알려줄까?', painPoint: '어디가 핫한지 모를 때', cta: '인기 클럽 보기' },
  night: { hook: '내상 0% 나이트, 후기로 증명', painPoint: '내상 입기 싫을 때', cta: '검증된 나이트 보기' },
  lounge: { hook: '분위기 확실한 곳만 골랐다', painPoint: '소개팅·데이트 장소 고민', cta: '라운지 둘러보기' },
  room: { hook: '접대 실패 없는 룸, 검증 완료', painPoint: '바가지 걱정될 때', cta: '프라이빗 룸 보기' },
  yojeong: { hook: 'VIP가 인정한 요정', painPoint: '격 있는 장소 찾을 때', cta: '전통 요정 보기' },
  hoppa: { hook: '여자들이 직접 쓴 솔직후기', painPoint: '안전하고 재미있는 곳', cta: '호빠 후기 보기' },
};

/* ── 트렌딩 키워드 (요일별 회전) ── */
const trendingKeywords = [
  ['강남클럽', '홍대나이트', '부산룸', '일산요정', '호빠후기', '강남라운지'],
  ['이태원클럽', '수원나이트', '해운대룸', '대전요정', '강남호빠', '압구정라운지'],
  ['홍대클럽', '일산나이트', '강남룸', '광주요정', '부산호빠', '잠실라운지'],
  ['부산클럽', '대구나이트', '수원룸', '대구요정', '인천호빠', '홍대라운지'],
  ['강남EDM', '인천나이트', '대전룸', '전주요정', '대전호빠', '강남바'],
  ['클럽추천', '나이트추천', '룸추천', '접대장소', '호빠추천', '분위기바'],
  ['오늘클럽', '주말나이트', '모임룸', '요정추천', '여자호빠', '데이트장소'],
];

/* ── Community hot posts — DB에서 가져옴 ── */
interface JogakItem { id: string; title: string; region: string; gender: string; current: number; max: number; time: string; }

function getTodayFortune() {
  const idx = new Date().getDate() % allFortunes.length;
  return allFortunes[idx];
}

/* ── Tabs ── */
const feedTabs = ['🔥인기', '🆕신규', '⭐추천', '📍지역별'] as const;

/* ── VenueCard — 재사용 카드 컴포넌트 (memo로 불필요한 리렌더링 방지) ── */
const VenueCard = memo(function VenueCard({ venue, isFavorite, toggleFavorite, rank }: { venue: Venue; isFavorite: boolean; toggleFavorite: (id: string) => void; rank?: number }) {
  return (
    <div className="relative">
      <Link target="_blank" rel="noopener noreferrer" to={getCategoryHref(venue.category, venue.slug, venue.region)} className="block">
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.02]">
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
            <img src={`/venues/${venue.slug}-1.webp`} alt={venue.nameKo} loading="lazy" width={300} height={300}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="absolute inset-0 w-full h-full object-cover z-[1]" />
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${
              venue.category === 'club' ? 'from-violet-500 to-indigo-700' :
              venue.category === 'night' ? 'from-blue-500 to-purple-700' :
              venue.category === 'lounge' ? 'from-amber-500 to-orange-700' :
              venue.category === 'room' ? 'from-rose-500 to-pink-700' :
              venue.category === 'yojeong' ? 'from-emerald-500 to-teal-700' :
              'from-pink-500 to-rose-700'
            }`}>
              <span className="text-3xl mb-1">{catEmoji[venue.category] || '🎵'}</span>
              <span className="text-[13px] font-black text-white">{venue.nameKo.length > 6 ? venue.nameKo.slice(0, 6) : venue.nameKo}</span>
              <span className="text-[10px] text-white/70 mt-0.5">{venue.regionKo} · {catLabel[venue.category]}</span>
              {venue.rating > 0 && <span className="text-[10px] text-yellow-300 mt-0.5">★ {venue.rating.toFixed(1)}</span>}
            </div>
            {rank && (
              <span className={`absolute top-2 left-2 z-[2] flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${rank <= 3 ? 'bg-[#8B5CF6]' : 'bg-black/50'}`}>
                {rank}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2.5 py-2">
              <h3 className="text-sm font-bold text-white leading-tight truncate">{venue.nameKo}</h3>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/90 truncate">{catLabel[venue.category]} · {venue.regionKo}</p>
                {venue.rating > 0 && <span className="text-[11px] text-yellow-300 font-bold">★ {venue.rating.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(venue.id); }}
        className="absolute top-2 right-2 z-[3] flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm" aria-label="찜하기">
        <svg className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  );
});

/* ══════════════════════════════════════════════════════ */
/*                    HOMEPAGE                            */
/* ══════════════════════════════════════════════════════ */

export default function HomePage() {
  useDocumentMeta('놀쿨 — 오늘 어디 갈지 못 정했죠? 20년 굴러본 사람이 골라드림', '오늘 어디 갈지 못 정했죠? 거를 곳 천지예요. 클럽·나이트·룸·요정·라운지·호빠 20년 본 사람이 1,000+ 업소 1줄로 정리. 주말 망치기 전에 →');
  const navigate = useNavigate();
  const { user } = useAuth();

  // 단계 5 — 관리자가 /admin/blocks에서 덮어쓸 수 있는 블록들
  const heroH1Override = usePageBlock('home', 'hero_h1', '');
  const heroSubtitle = usePageBlock('home', 'hero_subtitle', '');

  // venues 341KB chunk를 첫 페인트에서 제외 → LCP 단축.
  // idle 시 dynamic import해 검색/필터/추천 활성화. 위 fold UI는 정적 카운트로 즉시 표시.
  const [openVenues, setOpenVenues] = useState<Venue[]>([]);
  // 초기값 = 빌드 시 추출된 TOP4 정적 임베드 → 위폴드 "지금 핫한 곳" 4카드 즉시 렌더.
  // venues.ts(341KB) idle 로드 끝나면 setPopularVenues(getPopularVenues(20))으로 덮어쓰기.
  const [popularVenues, setPopularVenues] = useState<Venue[]>(() => VENUES_TOP4 as unknown as Venue[]);
  useEffect(() => {
    let cancelled = false;
    const run = () => import('@/data/venues').then(m => {
      if (cancelled) return;
      const open = m.venues.filter(v => v.status !== 'closed_or_unclear');
      setOpenVenues(open);
      setPopularVenues(m.getPopularVenues(20));
    });
    // requestIdleCallback 우선, 없으면 setTimeout. FCP/LCP 측정 끝난 뒤 로드.
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    const hasIdle = typeof w.requestIdleCallback === 'function';
    const id = hasIdle ? w.requestIdleCallback!(run) : setTimeout(run, 200);
    return () => {
      cancelled = true;
      if (hasIdle) w.cancelIdleCallback?.(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  // === 네이버 스타일 실시간 검색 ===
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // 실시간 검색 — 토큰 분리 + 카테고리/지역 인식
  const catKw: Record<string, string> = useMemo(() => ({
    '클럽': 'club', '나이트': 'night', '나이트클럽': 'night', '라운지': 'lounge',
    '바': 'lounge', '룸': 'room', '룸싸롱': 'room', '룸살롱': 'room',
    '요정': 'yojeong', '호빠': 'hoppa', '호스트바': 'hoppa', '고구려': 'night',
  }), []);
  const norm = useCallback((s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, ''), []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      const qn = norm(searchQuery);
      let detectedCat = '';
      let residual = qn;
      for (const [kw, code] of Object.entries(catKw).sort((a, b) => b[0].length - a[0].length)) {
        if (residual.includes(norm(kw))) { if (!detectedCat) detectedCat = code; residual = residual.replace(norm(kw), ''); }
      }
      const scored = openVenues.map(v => {
        let score = 0;
        const nk = norm(v.nameKo); const rk = norm(v.regionKo);
        if (nk === qn) score += 1000;
        else if (nk.startsWith(qn)) score += 600;
        else if (nk.includes(qn)) score += 300;
        if (v.tags?.some(t => norm(t) === qn)) score += 500;
        if (v.tags?.some(t => norm(t).includes(qn))) score += 150;
        if (detectedCat && v.category === detectedCat) score += 200;
        if (residual && (rk.includes(residual) || residual.includes(rk))) score += 200;
        if (residual && nk.includes(residual)) score += 150;
        if (qn.length >= 2 && score === 0) {
          for (let len = Math.min(qn.length, nk.length); len >= 2; len--) {
            let found = false;
            for (let i = 0; i <= qn.length - len; i++) { if (nk.includes(qn.substring(i, i + len))) { score += len * 15; found = true; break; } }
            if (found) break;
          }
        }
        if (v.isPremium) score += 20;
        return { venue: v, score };
      });
      const filtered = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
      setSearchResults(filtered.slice(0, 8).map(s => s.venue));
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, openVenues, catKw, norm]);

  // 검색창 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  };

  // === COMMUNITY DATA FROM SUPABASE ===
  const [jogakList, setJogakList] = useState<JogakItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // 조각모임 최신 4개
    (async () => {
      try {
        const { data } = await supabase.from('posts')
          .select('id, title, content, created_at, users!posts_user_id_fkey(nickname)')
          .eq('category', 'party')
          .order('created_at', { ascending: false })
          .limit(4);
        if (data && data.length > 0) {
          setJogakList(data.map((p: any) => {
            let parsed: any = {};
            try { parsed = JSON.parse(p.content); } catch {}
            return {
              id: p.id,
              title: p.title,
              region: parsed.region || '',
              gender: parsed.genderPref || '혼성',
              current: parsed.currentPeople || 1,
              max: parsed.maxPeople || 4,
              time: parsed.meetDate ? `${parsed.meetDate} ${parsed.meetTime || ''}` : '',
            };
          }));
        }
      } catch {}
    })();
  }, []);

  const displayJogak = useMemo(() => jogakList.length > 0 ? jogakList : seedJogakList, [jogakList]);

  // === TAB STATE ===
  const [activeTab, setActiveTab] = useState(0);

  // === REGION FILTER (지역별 탭 전용) ===
  const [activeRegion, setActiveRegion] = useState('all');


  // === FEED DATA ===
  const filteredVenues = useMemo(() => {
    let list = openVenues;
    // 지역 필터는 지역별 탭(탭3)에서만 적용
    if (activeTab === 3 && activeRegion !== 'all') list = list.filter(v => v.regionKo.includes(activeRegion));
    return list;
  }, [openVenues, activeRegion, activeTab]);

  const feedVenues = useMemo(() => {
    // 인기: rating + reviewCount 기반 실제 인기순
    if (activeTab === 0) return [...filteredVenues].sort((a, b) => (b.rating * 10 + b.reviewCount) - (a.rating * 10 + a.reviewCount)).slice(0, 30);
    // 신규: 최근 등록순 (배열 뒤쪽 = 최신)
    if (activeTab === 1) return [...filteredVenues].reverse().slice(0, 30);
    // 추천: 프리미엄 + 평점 높은 순
    if (activeTab === 2) return [...filteredVenues].sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return b.rating - a.rating;
    }).slice(0, 30);
    // 지역별: 지역 그룹으로 정렬
    return filteredVenues.slice(0, 30);
  }, [filteredVenues, activeTab]);

  // 지역별 탭용 그룹핑 데이터
  const regionGroupedVenues = useMemo(() => {
    if (activeTab !== 3) return null;
    const groups: Record<string, Venue[]> = {};
    filteredVenues.forEach(v => {
      if (!groups[v.regionKo]) groups[v.regionKo] = [];
      if (groups[v.regionKo].length < 6) groups[v.regionKo].push(v);
    });
    return Object.entries(groups).filter(([, list]) => list.length > 0);
  }, [filteredVenues, activeTab]);

  // === VS Vote (날짜별 키로 저장 — 날짜 바뀌면 투표 초기화) ===
  const vsDateKey = useMemo(() => {
    const d = new Date();
    return `nolcool_vs_home_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
  }, []);
  const [vsVotes, setVsVotes] = useState<Record<number, string>>(() => {
    try { const s = localStorage.getItem(vsDateKey); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [vsAnimating, setVsAnimating] = useState(false);
  const todayPolls = useMemo(() => {
    const d = new Date().getDate();
    return [vsPolls[d % vsPolls.length], vsPolls[(d + 3) % vsPolls.length]];
  }, []);
  const vsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (vsTimerRef.current) clearTimeout(vsTimerRef.current); }, []);
  const handleVsVote = useCallback((pollIdx: number, opt: string) => {
    if (vsVotes[pollIdx] || vsAnimating) return;
    setVsAnimating(true);
    setVsVotes(prev => {
      const next = { ...prev, [pollIdx]: opt };
      try { localStorage.setItem(vsDateKey, JSON.stringify(next)); } catch {}
      return next;
    });
    vsTimerRef.current = setTimeout(() => setVsAnimating(false), 600);
  }, [vsVotes, vsAnimating, vsDateKey]);

  // === Mini Quiz ===
  const [quizStep, setQuizStep] = useState(-1); // -1 = not started
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);

  // === Fortune ===
  const [fortuneRevealed, setFortuneRevealed] = useState(false);

  // === Favorites (하이브리드: localStorage + Supabase) ===
  const { favorites, toggleFavorite } = useFavoritesHook();

  const fortune = useMemo(() => getTodayFortune(), []);
  const fortuneScore = useMemo(() => Math.floor(60 + (new Date().getDate() * 7 + new Date().getMonth() * 13) % 40), []);

  // === Category counts (정적 — 빌드 시점 venues-counts.ts에서 주입) ===
  const catCounts = VENUES_BY_CATEGORY;

  // === Category TOP 3 (각 카테고리별 상위 3개) ===
  const categoryTop3 = useMemo(() => {
    const cats = ['club', 'night', 'lounge', 'room', 'yojeong', 'hoppa'] as const;
    const result: Record<string, Venue[]> = {};
    cats.forEach(cat => {
      result[cat] = openVenues
        .filter(v => v.category === cat)
        .sort((a, b) => (b.rating * 10 + b.reviewCount) - (a.rating * 10 + a.reviewCount))
        .slice(0, 3);
    });
    return result;
  }, [openVenues]);

  // === Today's trending keywords ===
  const todayTrending = useMemo(() => {
    const dow = new Date().getDay();
    return trendingKeywords[dow];
  }, []);

  // === Magazine teasers (최신 3개) ===
  const magazineTeasers = useMemo(() => magazineArticles.slice(0, 3), []);

  // === 오늘의 추천 업소 (큰 카드) ===
  const featuredVenue = useMemo(() => {
    const d = new Date().getDate();
    const top = popularVenues.slice(0, 5);
    return top[d % top.length];
  }, [popularVenues]);

  // 가짜 실시간 접속자 카운터 제거 — 출처 검증 불가 (놀쿨 신뢰 규칙)

  return (
    <div className="bg-white min-h-screen">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebSite', name: '놀쿨',
        url: 'https://nolcool.com',
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://nolcool.com/search?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList', name: '인기 매장',
        itemListElement: popularVenues.slice(0, 10).map((v, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'LocalBusiness', name: v.nameKo, address: v.address } })),
      }} />

      {/* ═══ 1. HERO V2 (다크 + 네온) + 6개 카테고리 ═══ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A0A0F 0%, #1F0A2A 50%, #0A0A1F 100%)' }}>
        {/* 네온 글로우 파티클 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute rounded-full animate-pulse" style={{
              width: `${4 + (i % 3) * 4}px`, height: `${4 + (i % 3) * 4}px`,
              top: `${8 + (i * 8) % 84}%`, left: `${4 + (i * 11) % 92}%`,
              background: i % 3 === 0 ? '#FF2E93' : i % 3 === 1 ? '#A855F7' : '#FFD700',
              opacity: 0.4, animationDelay: `${i * 0.25}s`, animationDuration: `${2 + i % 3}s`,
              boxShadow: i % 3 === 0 ? '0 0 12px #FF2E93' : i % 3 === 1 ? '0 0 12px #A855F7' : '0 0 12px #FFD700',
            }} />
          ))}
        </div>

        <div className="relative z-10 px-4 pt-4 pb-3 max-w-3xl mx-auto">
          {/* 실시간 접속자 + 타이틀 — 한 줄 */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-[22px] sm:text-[28px] font-black text-white leading-tight">
              {heroH1Override || '오늘 밤, 어디 갈래?'}
            </h1>
            {heroSubtitle && (
              <p className="mt-1 text-[13px] sm:text-sm text-white/80 w-full">{heroSubtitle}</p>
            )}
            {/* 가짜 라이브 접속자 배지 제거 (놀쿨 신뢰 규칙) */}
          </div>

          {/* 지역 퀵셀렉터 — 터치 한 번으로 "내 동네 있다" 확인 */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide pb-0.5" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            <span className="text-[10px] text-white/40 shrink-0 mr-0.5">전국 {VENUES_TOTAL_OPEN}곳</span>
            {['강남', '홍대', '부산', '일산', '대구', '대전', '수원', '인천', '광주', '울산', '제주'].map(r => (
              <button key={r} onClick={() => { setActiveTab(3); setActiveRegion(r); document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/70 font-medium active:bg-white/20 transition" style={{ minHeight: 44, minWidth: 44 }}>
                {r}
              </button>
            ))}
          </div>

          {/* 6개 카테고리 — 큰 터치 영역 */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {([
              { key: 'club', emoji: '🎵', label: '클럽', desc: 'EDM·힙합', href: '/clubs', gradient: 'from-violet-500/90 to-indigo-600/90' },
              { key: 'night', emoji: '🌙', label: '나이트', desc: '소셜댄스', href: '/nights', gradient: 'from-blue-500/90 to-purple-600/90' },
              { key: 'lounge', emoji: '🍸', label: '라운지', desc: '분위기 좋은 바', href: '/lounges', gradient: 'from-amber-500/90 to-orange-600/90' },
              { key: 'room', emoji: '🚪', label: '룸', desc: '프라이빗', href: '/rooms', gradient: 'from-rose-500/90 to-pink-600/90' },
              { key: 'yojeong', emoji: '🏮', label: '요정', desc: '전통 한정식', href: '/yojeong', gradient: 'from-emerald-500/90 to-teal-600/90' },
              { key: 'hoppa', emoji: '🥂', label: '호빠', desc: '여성 전용', href: '/hoppa', gradient: 'from-pink-500/90 to-rose-600/90' },
            ] as const).map(cat => (
              <Link
                key={cat.key}
                to={cat.href}
                className={`relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} backdrop-blur-sm p-2.5 sm:p-3 transition-all hover:scale-105 active:scale-95`}
                style={{ minHeight: 76 }}
              >
                <span className="text-xl sm:text-2xl mb-0.5">{cat.emoji}</span>
                <span className="text-[13px] font-black text-white">{cat.label}</span>
                <span className="text-[10px] text-white/60 mt-0.5 leading-tight">{cat.desc}</span>
                <span className="absolute top-1 right-1.5 text-[9px] font-bold text-white/40">{catCounts[cat.key] || 0}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 1.30 OPEN BETA 시그널 — 첫 100명 창립멤버 긴박감 ═══ */}
      <Suspense fallback={null}>
        <OpenBetaBanner />
      </Suspense>

      {/* ═══ 1.35 프라이버시 신뢰 뱃지 — 백만 회원 친구 추천 안심 포인트 ═══ */}
      <section className="px-4 pt-3 pb-1 max-w-3xl mx-auto">
        <Suspense fallback={null}>
          <PrivacyTrustBadge />
        </Suspense>
      </section>

      {/* ═══ 1.35 v25 큐레이션 4가지 — 시점·상황·예산 진입점 ═══ */}
      <section className="px-4 pt-2 pb-1 max-w-3xl mx-auto" aria-label="큐레이션 빠른 진입">
        <div className="grid grid-cols-4 gap-2">
          <Link to="/tonight" className="flex flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-white border border-[#8B5CF6]/20 py-2.5 active:scale-[0.97] transition">
            <span className="text-xl">🌙</span>
            <span className="text-[11px] font-bold text-[#111] leading-tight">오늘 밤</span>
          </Link>
          <Link to="/weekend" className="flex flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-[#EC4899]/10 to-white border border-[#EC4899]/20 py-2.5 active:scale-[0.97] transition">
            <span className="text-xl">📅</span>
            <span className="text-[11px] font-bold text-[#111] leading-tight">이번 주말</span>
          </Link>
          <Link to="/occasion" className="flex flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-[#FCD34D]/10 to-white border border-[#FCD34D]/30 py-2.5 active:scale-[0.97] transition">
            <span className="text-xl">🎯</span>
            <span className="text-[11px] font-bold text-[#111] leading-tight">상황별</span>
          </Link>
          <Link to="/budget" className="flex flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-[#10B981]/10 to-white border border-[#10B981]/20 py-2.5 active:scale-[0.97] transition">
            <span className="text-xl">💼</span>
            <span className="text-[11px] font-bold text-[#111] leading-tight">예산별</span>
          </Link>
        </div>
      </section>

      {/* ═══ 1.37 카톡 원클릭 친구 초대 — 입소문 가속기 ═══ */}
      <Suspense fallback={null}>
        <InviteFriendBox />
      </Suspense>

      {/* ═══ 1.4 방금 올라온 글 보호 영역 — #1 커뮤니티 재미. 30분 내 글 최상단 노출 ═══ */}
      <Suspense fallback={null}>
        <FreshPostsZone />
      </Suspense>

      {/* ═══ 1.45 단골 뱃지 — #4 매일 중독. 방문 연속일 표시 ═══ */}
      <section className="px-4 pt-2 pb-1 max-w-3xl mx-auto">
        <Suspense fallback={null}>
          <StreakBadge />
        </Suspense>
      </section>

      {/* ═══ 1.5 실시간 밤의 온도 TOP 10 — 명예욕 자극, 회원 활동 유도 ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <Suspense fallback={<div className="h-32" aria-hidden="true" />}>
          <TemperatureRanking limit={5} />
        </Suspense>
      </section>

      {/* ═══ 1.7 무한피드 — 1초 이탈 방지 + 페이지뷰 ↑↑ (TikTok/IG 스타일) ═══ */}
      <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
        <HomeFeed />
      </Suspense>

      {/* ═══ 2. 미니 성향테스트 — "3초 만에 오늘 밤 결정" (→ /quiz 유도) ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        {quizStep === -1 ? (
          <button onClick={() => setQuizStep(0)}
            className="w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] p-4 text-left transition-all active:scale-[0.98] relative overflow-hidden">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl opacity-30">🎯</div>
            <p className="text-[13px] font-bold text-white/80">3초 성향테스트</p>
            <p className="text-lg font-black text-white leading-tight mt-0.5">오늘 밤, 나한테 딱 맞는 곳은?</p>
            <p className="text-[11px] text-white/60 mt-1">터치 한 번이면 끝 →</p>
          </button>
        ) : quizStep < miniQuizQuestions.length ? (
          <div className="rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-br from-[#FAFAFE] to-[#F5F3FF] p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#111]">{miniQuizQuestions[quizStep].q}</p>
              <span className="text-[11px] text-[#8B5CF6] font-bold">{quizStep + 1}/{miniQuizQuestions.length}</span>
            </div>
            <div className="space-y-2">
              {miniQuizQuestions[quizStep].opts.map(opt => (
                <button key={opt.label} onClick={() => {
                  const newAnswers = [...quizAnswers, opt.result];
                  setQuizAnswers(newAnswers);
                  setQuizStep(quizStep + 1);
                }}
                  className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all active:scale-[0.98] active:border-[#8B5CF6]"
                  style={{ minHeight: 48 }}>
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-sm font-medium text-[#111]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-br from-[#F5F3FF] to-[#FDF2F8] p-4 animate-fade-in">
            <p className="text-sm font-bold text-[#8B5CF6] mb-1">당신의 오늘 밤 추천</p>
            {(() => {
              const counts: Record<string, number> = {};
              quizAnswers.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
              const topCat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'club';
              const topVenue = categoryTop3[topCat]?.[0];
              const copy = dreamCustomerCopy[topCat];
              return (
                <div className="space-y-2">
                  <p className="text-lg font-black text-[#111]">{catEmoji[topCat]} {copy?.hook}</p>
                  {topVenue && (
                    <Link to={getCategoryHref(topVenue.category, topVenue.slug, topVenue.region)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-3 active:bg-gray-50 transition">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F3F0FF] text-lg">{catEmoji[topCat]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111] truncate">{topVenue.nameKo}</p>
                        <p className="text-[11px] text-[#555]">{topVenue.regionKo} · {catLabel[topCat]}</p>
                      </div>
                      <span className="text-[#8B5CF6] font-bold text-sm">→</span>
                    </Link>
                  )}
                  <div className="flex gap-2">
                    <Link to={catHrefs[topCat] || '/clubs'} className="flex-1 rounded-xl bg-[#8B5CF6] py-2.5 text-center text-sm font-bold text-white active:scale-[0.98]" style={{ minHeight: 40 }}>
                      {copy?.cta || '더보기'}
                    </Link>
                    <Link to="/quiz" className="flex-1 rounded-xl border border-[#8B5CF6] py-2.5 text-center text-sm font-bold text-[#8B5CF6] active:scale-[0.98]" style={{ minHeight: 40 }}>
                      정밀 분석 받기
                    </Link>
                  </div>
                  <button onClick={() => { setQuizStep(-1); setQuizAnswers([]); }} className="w-full text-center text-[11px] text-[#666] py-1">다시 하기</button>
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* ═══ 실시간 활동 스트림 — 사이트가 살아있는 느낌 ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50/50 to-white p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-xs font-bold text-[#111]">지금 활동 중</span>
            <span className="text-[10px] text-gray-400 ml-auto">실시간</span>
          </div>
          <Suspense fallback={<div className="h-24" aria-hidden="true" />}>
            <LiveActivityFeed maxItems={4} interval={5000} />
          </Suspense>
        </div>
      </section>

      {/* ═══ v28 오늘 가장 본 곳 — 실 page_events 24h 집계 (가짜 카운터 X). 데이터 없으면 자동 숨김 ═══ */}
      <Suspense fallback={null}>
        <TrendingTodayWidget />
      </Suspense>

      {/* ═══ v28 최근 업데이트 — 광고주가 실제로 갱신한 venue (updated_at 가짜 터치 X) ═══ */}
      <Suspense fallback={null}>
        <RecentlyUpdatedWidget />
      </Suspense>

      {/* ═══ 한마디 남기기 — 회원/비회원 분기 ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        <Link to={user ? '/community/free?write=true' : '/login?redirect=/community/free?write=true'} className="block rounded-2xl border border-purple-100 bg-gradient-to-r from-[#F5F3FF] to-white p-4 active:bg-purple-50 transition">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/10">
              <span className="text-lg">✏️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">오늘 밤 어땠어? 한마디 남겨봐</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#8B5CF6] px-3 py-1.5 text-xs font-bold text-white">글쓰기</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
            <span>📝 후기 한 줄도 OK</span>
            <span>·</span>
            <span>💬 다녀온 사람만 아는 디테일</span>
          </div>
        </Link>
      </section>

      {/* ═══ 3. VS 투표 — 첫 화면에서 즉시 터치 인터랙션 (1개만) ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        {(() => {
          const poll = todayPolls[0];
          const voted = vsVotes[0];
          // 실제 투표 데이터가 연결되기 전까지는 50/50 표시 (가공 수치 금지)
          const aPct = 50;
          const bPct = 50;
          return (
            <div className="rounded-2xl border border-[#8B5CF6]/20 bg-gradient-to-br from-[#FAFAFE] to-[#F5F3FF] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#111]">{poll.q}</p>
                <Link to="/vs" className="text-[11px] text-[#8B5CF6] font-medium shrink-0 ml-2 inline-block py-1.5 -my-1.5">더보기</Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => handleVsVote(0, poll.a)} disabled={!!voted}
                  className={`relative rounded-xl overflow-hidden transition-all duration-300 ${voted === poll.a ? 'ring-2 ring-[#8B5CF6] scale-[1.02]' : voted ? 'opacity-60' : 'hover:shadow-md active:scale-95'}`}
                  style={{ minHeight: 60 }}>
                  {voted && <div className="absolute inset-0 bg-[#8B5CF6]/10 rounded-xl"><div className="absolute bottom-0 left-0 right-0 bg-[#8B5CF6]/20 transition-all duration-700 rounded-b-xl" style={{ height: `${aPct}%` }} /></div>}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full py-2">
                    <span className="text-xl">{poll.aEmoji}</span>
                    <span className="text-sm font-bold text-[#111]">{poll.a}</span>
                    {voted && <span className="text-base font-black text-[#8B5CF6]">{aPct}%</span>}
                  </div>
                </button>
                <button onClick={() => handleVsVote(0, poll.b)} disabled={!!voted}
                  className={`relative rounded-xl overflow-hidden transition-all duration-300 ${voted === poll.b ? 'ring-2 ring-[#EC4899] scale-[1.02]' : voted ? 'opacity-60' : 'hover:shadow-md active:scale-95'}`}
                  style={{ minHeight: 60 }}>
                  {voted && <div className="absolute inset-0 bg-[#EC4899]/10 rounded-xl"><div className="absolute bottom-0 left-0 right-0 bg-[#EC4899]/20 transition-all duration-700 rounded-b-xl" style={{ height: `${bPct}%` }} /></div>}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full py-2">
                    <span className="text-xl">{poll.bEmoji}</span>
                    <span className="text-sm font-bold text-[#111]">{poll.b}</span>
                    {voted && <span className="text-base font-black text-[#EC4899]">{bPct}%</span>}
                  </div>
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-center text-[#666]">{voted ? `${voted === poll.a ? poll.a : poll.b} 선택!` : '터치해서 투표'}</p>
            </div>
          );
        })()}
      </section>

      {/* ═══ 4. 실시간 TOP 4 — 핵심 업소 즉시 노출 ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-[#111]">지금 핫한 곳</h2>
          <Link to="/ranking" className="text-xs text-[#8B5CF6] font-medium inline-block py-1.5 -my-1.5">전체 순위 →</Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {popularVenues.slice(0, 4).map((v, i) => (
            <VenueCard key={v.id} venue={v} isFavorite={favorites.has(v.id)} toggleFavorite={toggleFavorite} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* ═══ 5. 커뮤니티 보드 퀵링크 (인기글 리스트는 위 HomeFeed가 담당) ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-[#111]">게시판 바로가기</h2>
          <Link to={user ? '/community/free?write=true' : '/login?redirect=/community/free?write=true'} className="inline-flex items-center rounded-full bg-[#8B5CF6] px-3 py-1.5 text-xs font-bold text-white" style={{ minHeight: 44 }}>글쓰기</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { label: '후기', href: '/community/reviews', emoji: '📝' },
            { label: 'Q&A', href: '/community/qna', emoji: '❓' },
            { label: '꿀팁', href: '/community/tips', emoji: '💡' },
            { label: '조각모임', href: '/community/jogak', emoji: '👥' },
            { label: '패션', href: '/community/fashion', emoji: '👔' },
          ].map(b => (
            <Link key={b.label} to={b.href} className="shrink-0 flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-[#555] active:bg-gray-50">
              <span>{b.emoji}</span>{b.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 5.5 뜨거운 토론 — 논쟁 유발 → 댓글 참여 유도 ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#111]">뜨거운 토론</h2>
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">HOT</span>
          </div>
          <Link to="/community/free" className="text-xs text-[#8B5CF6] font-medium inline-block py-1.5 -my-1.5">참여하기 →</Link>
        </div>
        <div className="space-y-2">
          {seedDebates.slice(0, 3).map(debate => (
            <Link key={debate.id} to="/community/free" className="block rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50/40 to-white p-3 active:bg-orange-50 transition">
              <p className="text-[13px] font-bold text-[#111] leading-snug mb-1.5">{debate.topic}</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 flex-1">
                  {debate.side.map((s, i) => (
                    <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${i === 0 ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'bg-pink-100 text-pink-600'}`}>"{s}"</span>
                  ))}
                </div>
                <span className="text-[10px] text-[#666]">💬 {debate.comments}</span>
                <span className="text-[10px] text-red-500 font-bold">{debate.heat}°</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 6. 검색바 — 정보 섹션 시작 전 자연스런 위치 ═══ */}
      <section className="px-4 py-1 max-w-3xl mx-auto">
        <div ref={searchWrapperRef} className="relative mx-auto" style={{ maxWidth: 520 }}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className={`flex items-center rounded-2xl border bg-white px-4 transition-all ${
              searchFocused ? 'border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/10' : 'border-gray-200 shadow-sm'
            }`}>
              <svg className="h-5 w-5 text-[#8B5CF6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input ref={searchInputRef} type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)} placeholder="업소명, 지역, 업종으로 검색..."
                className="h-11 w-full bg-transparent px-3 text-[14px] text-[#111] outline-none placeholder-gray-400 [&::-webkit-search-cancel-button]:hidden"
                autoComplete="off" autoCorrect="off" spellCheck={false} />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </form>
          {searchFocused && (
            <div className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-fade-in" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {searchQuery.trim() && searchResults.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-1.5 text-[11px] font-bold text-[#8B5CF6] tracking-wider">검색 결과</p>
                  {searchResults.map((v) => (
                    <Link key={v.id || v.slug} to={getCategoryHref(v.category, v.slug, v.region)} target="_blank" rel="noopener noreferrer"
                      onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F0FF] text-sm font-bold text-[#8B5CF6]">{v.nameKo.charAt(0)}</div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-medium text-[#111] truncate">{v.nameKo}</p>
                        <p className="text-xs text-[#555] truncate">{v.regionKo} · {catLabel[v.category]}</p>
                      </div>
                    </Link>
                  ))}
                  <button onClick={handleSearchSubmit} className="w-full border-t border-gray-100 py-3 text-center text-sm font-medium text-[#8B5CF6] hover:bg-gray-50 transition">
                    "{searchQuery}" 전체 검색 결과 보기
                  </button>
                </div>
              ) : searchQuery.trim() && searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-[#555]">"{searchQuery}" 결과가 없습니다</p>
                  <p className="mt-1 text-xs text-gray-400">다른 키워드로 검색해 보세요</p>
                </div>
              ) : (
                <div className="py-3">
                  <p className="px-4 py-1.5 text-[11px] font-bold text-[#8B5CF6] tracking-wider">인기 검색어</p>
                  {['강남클럽', '홍대나이트', '일산룸', '강남호빠', '해운대', '압구정라운지', '일산요정', '부산나이트'].map((term, i) => (
                    <button key={term} onClick={() => { setSearchQuery(term); searchInputRef.current?.focus(); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                      <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${i < 3 ? 'bg-[#8B5CF6] text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                      <span className="text-sm text-[#111]">{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══ 7. 조각모임 — 마감 임박 긴급감 + 클릭 유도 ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#111]">조각모임</h2>
            <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold text-white">모집중</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={user ? '/community/jogak?write=true' : '/login?redirect=/community/jogak?write=true'} className="inline-flex items-center rounded-full bg-[#8B5CF6] px-3 py-1.5 text-xs font-bold text-white" style={{ minHeight: 44 }}>모임만들기</Link>
            <Link to="/community/jogak" className="text-xs text-[#8B5CF6] font-medium inline-block py-1.5 -my-1.5">전체 →</Link>
          </div>
        </div>
        <div className="space-y-2">
          {displayJogak.slice(0, 4).map((j, idx) => {
            const fillRate = j.current / j.max;
            const isAlmostFull = fillRate >= 0.7;
            return (
              <Link key={j.id} to="/community/jogak" className={`block rounded-xl border bg-white p-3 active:bg-gray-50 transition ${isAlmostFull ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isAlmostFull && <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">마감임박</span>}
                    {idx === 0 && !isAlmostFull && <span className="shrink-0 rounded bg-[#8B5CF6] px-1.5 py-0.5 text-[9px] font-bold text-white">HOT</span>}
                    <p className="text-sm font-medium text-[#111] truncate">{j.title}</p>
                  </div>
                  <span className={`ml-2 flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-bold text-white ${isAlmostFull ? 'bg-red-500' : 'bg-[#8B5CF6]'}`}>참여</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  {j.region && <span className="text-[11px] text-[#555]">📍{j.region}</span>}
                  <span className="text-[11px] text-[#555]">👤{j.gender}</span>
                  {j.time && <span className="text-[11px] text-[#555]">🕐{j.time}</span>}
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isAlmostFull ? 'bg-red-500' : 'bg-[#8B5CF6]'}`} style={{ width: `${fillRate * 100}%` }} />
                    </div>
                    <span className={`text-[11px] font-bold ${isAlmostFull ? 'text-red-500' : 'text-[#111]'}`}>{j.current}/{j.max}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="text-center text-[11px] text-[#666] mt-2">혼자 가기 심심하면 여기서 크루를 만들어봐</p>
      </section>

      {/* ═══ 8. 오늘 밤 운세 — 터치 인터랙션 (스크롤 보상) ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        {!fortuneRevealed ? (
          <button onClick={() => setFortuneRevealed(true)}
            className="w-full rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-800 p-5 text-center transition-all hover:shadow-xl active:scale-[0.98] relative overflow-hidden"
            style={{ minHeight: 100 }}>
            <div className="absolute inset-0 opacity-20">
              {['✦', '✧', '⭑'].map((s, i) => (
                <span key={i} className="absolute text-white animate-pulse" style={{ top: `${20 + i * 25}%`, left: `${15 + i * 30}%`, fontSize: `${12 + i * 3}px`, animationDelay: `${i * 0.3}s` }}>{s}</span>
              ))}
            </div>
            <div className="relative z-10">
              <span className="text-3xl block mb-2">🔮</span>
              <p className="text-base font-black text-white">터치해서 오늘의 밤 운세 확인</p>
              <p className="text-[11px] text-white/50 mt-1">매일 자정에 바뀌는 당신만의 운세</p>
            </div>
          </button>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50 border border-purple-200 p-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{fortune.emoji}</span>
              <div className="flex-1">
                <p className="text-base font-black text-[#111]">{fortune.title}</p>
                <p className="text-[11px] text-[#8B5CF6] font-bold">밤 에너지 {fortuneScore}점</p>
              </div>
            </div>
            <p className="text-sm font-bold text-[#111] leading-relaxed mb-3 bg-white/60 rounded-xl p-3">{fortune.text}</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-lg bg-white/80 p-2 text-center">
                <p className="text-[9px] text-[#666]">행운 장소</p>
                <p className="text-xs font-bold text-[#111]">{fortune.lucky}</p>
              </div>
              <div className="rounded-lg bg-white/80 p-2 text-center">
                <p className="text-[9px] text-[#666]">행운 색</p>
                <p className="text-xs font-bold text-[#111]">{fortune.luckyColor}</p>
              </div>
              <div className="rounded-lg bg-white/80 p-2 text-center">
                <p className="text-[9px] text-[#666]">행운 숫자</p>
                <p className="text-xs font-bold text-[#8B5CF6]">{fortune.luckyNum}</p>
              </div>
            </div>
            <div className="rounded-lg bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 p-2.5">
              <p className="text-[11px] font-bold text-[#8B5CF6] mb-0.5">꿀팁</p>
              <p className="text-[13px] text-[#333] leading-relaxed">{fortune.tip}</p>
            </div>
            <button onClick={() => setFortuneRevealed(false)} className="mt-2 w-full text-center text-[11px] text-[#666] py-1.5">카드 다시 덮기</button>
          </div>
        )}
      </section>

      {/* ═══ 9. 매거진 스토리 — 콘텐츠 깊이 유도 (→ /magazine/*) ═══ */}
      <section className="py-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-base font-bold text-[#111]">놀쿨 매거진</h2>
          <Link to="/magazine" className="text-xs text-[#8B5CF6] font-medium inline-block py-1.5 -my-1.5">전체 →</Link>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {magazineTeasers.map(article => (
            <Link key={article.id} to={`/magazine/${article.id}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" style={{ width: 240 }}>
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                <div className="bg-gradient-to-br from-[#1a0533] to-[#2d1b69] px-4 py-3">
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">{article.tag}</span>
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-bold text-[#111] leading-snug line-clamp-2 mb-1">{article.title}</p>
                  <p className="text-[11px] text-[#555] line-clamp-2 leading-relaxed">{article.excerpt.slice(0, 60)}...</p>
                  <span className="text-[11px] font-bold text-[#8B5CF6] mt-1.5 inline-block">읽어보기 →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 10. 카테고리별 TOP 3 — 드림고객 카피로 클릭 유도 ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto">
        <h2 className="text-base font-bold text-[#111] mb-3">카테고리별 인기 TOP 3</h2>
        <div className="space-y-4">
          {(['club', 'night', 'room', 'lounge', 'yojeong', 'hoppa'] as const).map(cat => {
            const top = categoryTop3[cat];
            const copy = dreamCustomerCopy[cat];
            if (!top || top.length === 0) return null;
            return (
              <div key={cat} className="rounded-2xl border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{catEmoji[cat]}</span>
                    <div>
                      <p className="text-sm font-bold text-[#111]">{catLabel[cat]}</p>
                      <p className="text-[10px] text-[#8B5CF6] font-medium">{copy?.painPoint}</p>
                    </div>
                  </div>
                  <Link to={catHrefs[cat]} className="text-[11px] text-[#8B5CF6] font-medium inline-block py-1.5 -my-1.5">{copy?.cta} →</Link>
                </div>
                <div className="space-y-1.5">
                  {top.map((v, i) => (
                    <Link key={v.id} to={getCategoryHref(v.category, v.slug, v.region)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 py-1.5 active:bg-gray-50 rounded-lg px-1 transition">
                      <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-black text-white ${i === 0 ? 'bg-[#8B5CF6]' : i === 1 ? 'bg-violet-400' : 'bg-gray-400'}`}>{i + 1}</span>
                      <span className="text-[13px] font-medium text-[#111] truncate flex-1">{v.nameKo}</span>
                      <span className="text-[11px] text-[#555]">{v.regionKo}</span>
                      {v.rating > 0 && <span className="text-[11px] text-yellow-500 font-bold">★{v.rating.toFixed(1)}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ 11. 트렌딩 키워드 — 검색 유도 (→ /search) ═══ */}
      <section className="px-4 py-2 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-[#111]">지금 뜨는 검색어</h2>
          <Link to="/search" className="text-xs text-[#8B5CF6] font-medium inline-block py-1.5 -my-1.5">검색 →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {todayTrending.map((kw, i) => (
            <Link key={kw} to={`/search?q=${encodeURIComponent(kw)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 active:bg-gray-50 transition"
              style={{ minHeight: 44 }}>
              <span className={`text-[10px] font-black ${i < 3 ? 'text-[#8B5CF6]' : 'text-[#666]'}`}>{i + 1}</span>
              <span className="text-[13px] font-medium text-[#111]">{kw}</span>
              {i < 2 && <span className="text-[9px] text-red-500 font-bold">HOT</span>}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 12. 피처드 카드 + 가로 스크롤 TOP 8 ═══ */}
      {featuredVenue && (
        <section className="px-4 py-2 max-w-3xl mx-auto">
          <Link to={getCategoryHref(featuredVenue.category, featuredVenue.slug, featuredVenue.region)} target="_blank" rel="noopener noreferrer" className="block">
            <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${
              featuredVenue.category === 'club' ? 'from-violet-600 to-indigo-800' :
              featuredVenue.category === 'night' ? 'from-blue-600 to-purple-800' :
              featuredVenue.category === 'lounge' ? 'from-amber-600 to-orange-800' :
              featuredVenue.category === 'room' ? 'from-rose-600 to-pink-800' :
              featuredVenue.category === 'yojeong' ? 'from-emerald-600 to-teal-800' :
              'from-pink-600 to-rose-800'
            }`} style={{ minHeight: 130 }}>
              <img src={`/venues/${featuredVenue.slug}-1.webp`} alt={featuredVenue.nameKo} width={600} height={300} loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                className="absolute inset-0 w-full h-full object-cover z-[1] opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[2]" />
              <div className="relative z-[3] flex flex-col justify-end h-full p-4" style={{ minHeight: 130 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-[#8B5CF6] px-2 py-0.5 text-[10px] font-bold text-white">1위</span>
                  <span className="text-[11px] text-white/80">{catLabel[featuredVenue.category]} · {featuredVenue.regionKo}</span>
                </div>
                <h3 className="text-lg font-black text-white leading-tight">{featuredVenue.nameKo}</h3>
                {featuredVenue.rating > 0 && <span className="text-[13px] font-bold text-yellow-300 mt-0.5">★ {featuredVenue.rating.toFixed(1)} · 리뷰 {featuredVenue.reviewCount}개</span>}
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="py-2 max-w-3xl mx-auto">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-base font-bold text-[#111]">TOP 8</h2>
          <Link to="/ranking" className="text-xs text-[#8B5CF6] font-medium inline-block py-1.5 -my-1.5">전체보기 →</Link>
        </div>
        <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-1">
          {popularVenues.slice(0, 8).map((v, i) => (
            <Link key={v.id} to={getCategoryHref(v.category, v.slug, v.region)} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" style={{ width: 120 }}>
              <div className="relative rounded-xl overflow-hidden" style={{ width: 120, height: 120 }}>
                <img src={`/venues/${v.slug}-1.webp`} alt={v.nameKo} width={120} height={120} loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="absolute inset-0 w-full h-full object-cover z-[1]" />
                <div className={`absolute inset-0 flex flex-col items-center justify-center ${
                  v.category === 'club' ? 'bg-gradient-to-br from-violet-500 to-indigo-700' :
                  v.category === 'night' ? 'bg-gradient-to-br from-blue-500 to-purple-700' :
                  v.category === 'lounge' ? 'bg-gradient-to-br from-amber-500 to-orange-700' :
                  v.category === 'room' ? 'bg-gradient-to-br from-rose-500 to-pink-700' :
                  v.category === 'yojeong' ? 'bg-gradient-to-br from-emerald-500 to-teal-700' :
                  'bg-gradient-to-br from-pink-500 to-rose-700'
                }`}>
                  <span className="text-2xl">{catEmoji[v.category] || '🎵'}</span>
                  <span className="mt-0.5 text-[11px] font-bold text-white/80">{v.nameKo.slice(0, 4)}</span>
                </div>
                <span className={`absolute top-1.5 left-1.5 z-[2] flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${i < 3 ? 'bg-[#8B5CF6]' : 'bg-black/50'}`}>{i + 1}</span>
                <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2 py-1.5">
                  <p className="text-[11px] font-bold text-white truncate">{v.nameKo}</p>
                  <p className="text-[9px] text-white/80 truncate">{catLabel[v.category]} · {v.regionKo}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ FEED — 정렬 탭 ═══ */}
      <section id="feed-section" className="mt-2 max-w-3xl mx-auto">
        {/* 정렬 탭 */}
        <div className="flex border-b border-gray-100">
          {feedTabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(i); if (i !== 3) setActiveRegion('all'); }}
              className={`flex-1 py-2.5 text-center text-sm font-medium transition-all relative ${
                activeTab === i ? 'text-[#8B5CF6] font-bold' : 'text-[#555]'
              }`}
              style={{ minHeight: 40 }}
            >
              {tab}
              {activeTab === i && <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-[#8B5CF6]" />}
            </button>
          ))}
        </div>
        {/* 지역별 탭 선택 시에만 지역 필터 표시 */}
        {activeTab === 3 && (
          <div
            className="scrollbar-hide px-4 py-2 bg-gray-50/80"
            style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              {regionLabels.map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRegion(r === '전체' ? 'all' : r)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    (r === '전체' && activeRegion === 'all') || (r !== '전체' && activeRegion === r)
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'bg-white text-[#555] border border-gray-200'
                  }`}
                  style={{ minHeight: 44 }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══ VENUE FEED — 2 Column Cards ═══ */}
      <section className="px-4 py-4 max-w-3xl mx-auto">
        {/* 탭 라벨 */}
        {activeTab === 0 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">평점 + 리뷰 수 기반 실시간 인기순</p>}
        {activeTab === 1 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">최근 등록된 업소 순</p>}
        {activeTab === 2 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">프리미엄 + 평점 높은 순 추천</p>}
        {activeTab === 3 && <p className="text-xs font-medium text-[#8B5CF6] mb-3">지역별로 한눈에 보기</p>}

        {/* 지역별 탭 — 지역 그룹 레이아웃 */}
        {activeTab === 3 && regionGroupedVenues ? (
          <div className="space-y-6">
            {regionGroupedVenues.map(([region, list]) => (
              <div key={region}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#111]">📍 {region}</h3>
                  <span className="text-xs text-[#666]">{list.length}곳</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {list.map(venue => (
                    <VenueCard key={venue.id} venue={venue} isFavorite={favorites.has(venue.id)} toggleFavorite={toggleFavorite} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 인기/신규/추천 — 일반 그리드 */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {feedVenues.map((venue, idx) => {
              const cards = [];

              cards.push(<VenueCard key={venue.id} venue={venue} isFavorite={favorites.has(venue.id)} toggleFavorite={toggleFavorite} rank={activeTab === 0 ? idx + 1 : undefined} />);

              // 4번째 — 성향테스트 CTA
              if (idx + 1 === 4) {
                cards.push(
                  <Link key={`quiz-cta-${idx}`} to="/quiz" className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] p-3 active:scale-[0.98] transition text-center">
                    <p className="text-sm font-bold text-white">🎯 나한테 딱 맞는 업소 찾기 — 성향테스트 GO →</p>
                  </Link>
                );
              }

              // 8번째 — 커뮤니티 CTA
              if (idx + 1 === 8) {
                cards.push(
                  <Link key={`cta-${idx}`} to="/community" className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-[#F3F0FF] to-white border border-purple-100 p-3 active:bg-gray-50 transition text-center">
                    <p className="text-sm font-bold text-[#8B5CF6]">💬 커뮤니티에서 후기·꿀팁·조각모임 확인하기 →</p>
                  </Link>
                );
              }

              // 12번째 — TOP5
              if (idx + 1 === 12) {
                cards.push(
                  <div key={`top5-${idx}`} className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-violet-50 to-white p-4">
                    <p className="text-xs font-bold text-[#8B5CF6] mb-2">🏆 이번주 TOP 5</p>
                    <div className="space-y-1">
                      {popularVenues.slice(0, 5).map((v, i) => (
                        <Link key={v.id} to={getCategoryHref(v.category, v.slug, v.region)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-1">
                          <span className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${i < 3 ? 'bg-[#8B5CF6] text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                          <span className="text-sm text-[#111] truncate">{v.nameKo}</span>
                          <span className="ml-auto text-xs text-[#555]">{v.regionKo}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              // 16번째 — 매거진 CTA
              if (idx + 1 === 16) {
                cards.push(
                  <Link key={`mag-cta-${idx}`} to="/magazine" target="_blank" rel="noopener noreferrer" className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-3 active:bg-gray-50 transition text-center">
                    <p className="text-sm font-bold text-[#111]">📰 놀쿨 매거진 — 업소별 심층 리뷰·비교 분석 읽기 →</p>
                  </Link>
                );
              }

              // 20번째 — VS 투표 CTA
              if (idx + 1 === 20) {
                cards.push(
                  <Link key={`vs-cta-${idx}`} to="/vs" className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100 p-3 active:bg-gray-50 transition text-center">
                    <p className="text-sm font-bold text-[#8B5CF6]">🆚 투표로 결정하자 — VS 배틀 참여하기 →</p>
                  </Link>
                );
              }

              // 24번째 — 뜨거운 토론 유도
              if (idx + 1 === 24) {
                const debate = seedDebates[new Date().getDate() % seedDebates.length];
                cards.push(
                  <Link key={`debate-cta-${idx}`} to="/community/free" className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl border border-orange-100 bg-orange-50/50 p-3 active:bg-orange-50 transition">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">HOT</span>
                      <span className="text-[11px] text-red-500 font-bold">{debate.heat}° 뜨거운 토론</span>
                    </div>
                    <p className="text-sm font-bold text-[#111]">💬 {debate.topic}</p>
                  </Link>
                );
              }

              // 28번째 — 글쓰기 강력 유도
              if (idx + 1 === 28) {
                cards.push(
                  <Link key={`write-cta-${idx}`} to={user ? '/community/free?write=true' : '/login?redirect=/community/free?write=true'} className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] p-4 active:scale-[0.98] transition text-center">
                    <p className="text-base font-bold text-white">여기까지 봤으면 한마디 남기고 가</p>
                    <p className="text-[11px] text-white/70 mt-0.5">단골만 아는 디테일이 다음 사람을 살린다</p>
                  </Link>
                );
              }

              return cards;
            })}
          </div>
        )}

        {feedVenues.length === 0 && (
          <div className="text-center py-12 text-[#666]">
            <p className="text-sm">이 지역에 등록된 업소가 없습니다</p>
          </div>
        )}
      </section>

      {/* ═══ LUCKY ROULETTE (lazy — 위폴드 hydration TBT 절감) ═══ */}
      <LuckyRoulette openVenues={openVenues} />

      {/* ═══ 무한 추천 루프 (lazy) — 끝없이 더보기 ═══ */}
      <InfiniteRecommendLoop venues={openVenues} popularVenues={popularVenues} />

      {/* ═══ QUICK LINKS — 확장된 "더 놀기" 그리드 ═══ */}
      <section className="px-4 py-3 max-w-3xl mx-auto space-y-3">
        <h2 className="text-base font-bold text-[#111]">더 놀기</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🔍', title: '비교', href: '/compare', desc: '업소 맞대결' },
            { icon: '📖', title: '가이드', href: '/guide', desc: '입문자 필독' },
            { icon: '🆚', title: 'VS 투표', href: '/vs', desc: '투표 참여' },
            { icon: '📰', title: '매거진', href: '/magazine', desc: '심층 분석' },
            { icon: '🏆', title: '랭킹', href: '/ranking', desc: '전국 순위' },
            { icon: '🎰', title: '룰렛', href: '/roulette', desc: '랜덤 추천' },
            { icon: '🧠', title: '성향 테스트', href: '/quiz', desc: '내 취향 분석' },
            { icon: '🎉', title: '이벤트', href: '/events', desc: '진행중' },
          ].map(card => (
            <Link key={card.title} to={card.href} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-2 text-center shadow-sm active:scale-[0.97] transition" style={{ minHeight: 56 }}>
              <span className="text-lg">{card.icon}</span>
              <span className="text-[12px] font-bold text-[#111]">{card.title}</span>
              <span className="text-[9px] text-[#666]">{card.desc}</span>
            </Link>
          ))}
        </div>

        {/* 카테고리 전체 바로가기 */}
        <div className="rounded-2xl border border-gray-100 bg-[#FAFAFE] p-3">
          <p className="text-[11px] font-bold text-[#8B5CF6] mb-2">카테고리 바로가기</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '🎵', label: '클럽', href: '/clubs' },
              { emoji: '🌙', label: '나이트', href: '/nights' },
              { emoji: '🍸', label: '라운지', href: '/lounges' },
              { emoji: '🚪', label: '룸', href: '/rooms' },
              { emoji: '🏮', label: '요정', href: '/yojeong' },
              { emoji: '🥂', label: '호빠', href: '/hoppa' },
            ].map(cat => (
              <Link key={cat.label} to={cat.href}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-gray-100 px-2.5 py-2 active:bg-gray-50 transition" style={{ minHeight: 36 }}>
                <span>{cat.emoji}</span>
                <span className="text-[13px] font-medium text-[#111]">{cat.label}</span>
                <span className="ml-auto text-[11px] text-[#8B5CF6]">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-violet-50 border border-violet-200 px-5 py-3 text-center">
          <p className="text-sm font-bold text-[#111]">
            구글 · ChatGPT · Gemini에서 <span className="text-lg text-[#8B5CF6]" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>"놀쿨"</span> 검색하세요
          </p>
        </div>

        {/* 실시간 현황 위젯 */}
        <Suspense fallback={null}>
          <LiveStats />
        </Suspense>
      </section>

      {/* ═══ SEO TEXT ═══ */}
      <section className="px-4 pb-8 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-[#F5F5F5] p-5">
          <h2 className="mb-2 text-base font-bold text-[#111]">전국 클럽·나이트·라운지 실시간 정보</h2>
          <div className="space-y-2 text-sm leading-relaxed text-[#555]">
            <p>
              놀쿨은 전국 {VENUES_TOTAL_OPEN}개 클럽, 나이트, 라운지, 룸, 요정, 호빠의 실시간 정보를 제공하는 대한민국 대표 나이트라이프 플랫폼입니다.
              강남 클럽부터 일산 나이트, 부산 아시아드까지 직접 가본 사람의 솔직한 후기와 실시간 분위기를 확인할 수 있습니다.
            </p>
            <p>
              조각모임으로 함께 갈 사람을 찾고, 커뮤니티에서 실시간 정보를 공유하세요.
              EDM 클럽부터 소셜 댄스 나이트까지, 오늘 밤의 선택을 놀쿨에서 시작하세요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
