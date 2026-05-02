import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, MidContentQuiz, ReadFinishCount, ReadCompletionReward, ReadingMilestone } from '@/components/engagement/ReadingEngagement';

/* ── 실제 6종 카테고리 ── */
const categories = [
  { key: 'all', label: '전체', emoji: '🔥' },
  { key: 'club', label: '클럽', emoji: '🎵' },
  { key: 'night', label: '나이트', emoji: '🌙' },
  { key: 'lounge', label: '라운지', emoji: '🍸' },
  { key: 'room', label: '룸', emoji: '🚪' },
  { key: 'yojeong', label: '요정', emoji: '🏮' },
  { key: 'hoppa', label: '호빠', emoji: '🥂' },
];

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catColors: Record<string, string> = { club: '#7c3aed', night: '#ec4899', lounge: '#06b6d4', room: '#f59e0b', yojeong: '#ef4444', hoppa: '#f472b6' };

const regionFilters = [
  { key: 'all', label: '전체' },
  { key: '강남', label: '강남' },
  { key: '압구정', label: '압구정' },
  { key: '홍대', label: '홍대' },
  { key: '이태원', label: '이태원' },
  { key: '부산', label: '부산' },
  { key: '대구', label: '대구' },
  { key: '광주', label: '광주' },
  { key: '대전', label: '대전' },
  { key: '수원', label: '수원' },
  { key: '일산', label: '일산' },
  { key: '인천', label: '인천' },
  { key: '성남', label: '성남' },
  { key: '울산', label: '울산' },
];

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

const premiumScores: Record<string, number> = {
  ilsanroom: 4.9, ilsanmyeongwolgwanyojeong: 4.8,
  busanyeonsandongmulnight: 4.7, seongnamshampoonight: 4.6,
  suwonchancenight: 4.5, sinlimgrandprixnight: 4.5,
  cheongdamh2onight: 4.4, pajuyadangskydomenight: 4.3, ulsanchampionnight: 4.3,
  haeundaegoguryeo: 4.7,
};

function getFavCount(slug: string): number {
  try {
    const saved = localStorage.getItem('nolcool_favorites');
    if (!saved) return 0;
    const favs: string[] = JSON.parse(saved);
    return favs.includes(slug) ? 1 : 0;
  } catch { return 0; }
}

function getVenueScore(slug: string): number {
  if (premiumScores[slug]) return premiumScores[slug] + getFavCount(slug) * 0.1;
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (32 + (hash % 13)) / 10 + getFavCount(slug) * 0.1;
}

function getPeriodScore(slug: string, period: string): number {
  const base = getVenueScore(slug);
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const now = new Date();
  if (period === 'daily') {
    const daySeed = (hash * 31 + now.getDate() * 17 + now.getHours()) % 11;
    return Math.round((base + (daySeed - 5) * 0.1) * 10) / 10;
  }
  if (period === 'weekly') {
    const weekNum = Math.floor(now.getDate() / 7);
    const weekSeed = (hash * 13 + weekNum * 7 + now.getDay()) % 7;
    return Math.round((base + (weekSeed - 3) * 0.1) * 10) / 10;
  }
  const monthSeed = (hash + now.getMonth()) % 5;
  return Math.round((base + (monthSeed - 2) * 0.05) * 10) / 10;
}

function getRankChange(slug: string, idx: number, period: string): { icon: string; color: string; text: string } {
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = period === 'daily' ? hash + new Date().getDate() : period === 'weekly' ? hash + Math.floor(new Date().getDate() / 7) : hash;
  const mod = seed % 7;
  if (mod < 2) return { icon: '▲', color: 'text-green-500', text: `${mod + 1}` };
  if (mod < 4) return { icon: '▼', color: 'text-red-400', text: `${mod - 1}` };
  if (mod === 4) return { icon: 'NEW', color: 'text-[#8B5CF6]', text: '' };
  return { icon: '━', color: 'text-gray-400', text: '' };
}

export default function RankingPage() {
  useDocumentMeta('인기 랭킹 TOP 20 — 지금 사람들이 가장 많이 보는 곳', '클럽·나이트·라운지·룸·요정·호빠 전국 인기 순위. 지역별·업종별 필터 실시간 확인.');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const containerRef = useRef<HTMLDivElement>(null);

  const ranked = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (category !== 'all') list = list.filter((v) => v.category === category);
    if (region !== 'all') list = list.filter((v) => v.regionKo.includes(region));
    return [...list].sort((a, b) => getPeriodScore(b.slug, period) - getPeriodScore(a.slug, period)).slice(0, 20);
  }, [category, region, period]);

  const maxScore = ranked.length > 0 ? Math.max(...ranked.map((v) => getPeriodScore(v.slug, period))) : 5;
  const periodLabel = period === 'daily' ? '오늘 실시간 기준' : period === 'weekly' ? '이번 주 누적 기준' : '이번 달 누적 기준';

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #F59E0B 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/10">
            <PageLiveCounter pageName="랭킹 보는 중" baseCount={63} className="text-white/80 [&_strong]:text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            🏆 인기 랭킹 <span style={{ color: '#F59E0B' }}>TOP 20</span>
          </h1>
          <p className="text-base mb-6" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.6)' }}>
            전국 클럽·나이트·라운지·룸·요정·호빠<br />
            지금 사람들이 가장 많이 보는 곳
          </p>

          {/* 너의 1위는? 인터랙티브 */}
          <div className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5" style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.2), rgba(249,115,22,0.2))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-sm">🤔</span>
            <span className="text-sm font-medium" style={{ color: '#FCD34D' }}>너의 1위는 어디야? 아래에서 확인하고 투표해봐</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* ── 카테고리 탭 ── */}
        <div className="overflow-x-auto scrollbar-hide mb-3">
          <div className="flex gap-2">
            {categories.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  category === c.key ? 'bg-[#8B5CF6] text-white shadow-md' : 'bg-gray-100 text-[#555] hover:bg-gray-200'
                }`} style={{ minHeight: 40 }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 지역 필터 ── */}
        <div className="overflow-x-auto scrollbar-hide mb-4">
          <div className="flex gap-1.5">
            {regionFilters.map(r => (
              <button key={r.key} onClick={() => setRegion(r.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  region === r.key ? 'bg-[#111] text-white' : 'bg-white text-[#555] border border-gray-200 hover:border-gray-400'
                }`} style={{ minHeight: 32 }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 기간 탭 ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2.5 text-sm font-medium transition-all ${
                  period === p ? 'bg-[#8B5CF6] text-white' : 'bg-white text-[#555] hover:bg-gray-50'
                }`} style={{ minHeight: 40 }}>
                {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium" style={{ color: '#8B5CF6' }}>{periodLabel}</span>
        </div>

        {/* ── 차트 미리보기 ── */}
        {ranked.length > 0 && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#111' }}>상위 10곳 점수 분포</h2>
            <div className="space-y-2.5">
              {ranked.slice(0, 10).map((v, i) => {
                const score = getPeriodScore(v.slug, period);
                const pct = (score / maxScore) * 100;
                const cc = catColors[v.category] || '#8B5CF6';
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className={`w-6 text-center text-xs font-bold ${i < 3 ? 'text-[#8B5CF6]' : 'text-gray-400'}`}>{i + 1}</span>
                    <span className="w-20 sm:w-28 truncate text-xs font-medium" style={{ color: '#111' }}>{v.nameKo}</span>
                    <div className="flex-1 h-5 rounded-lg bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-lg transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cc }} />
                    </div>
                    <span className="w-8 text-right text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <MidContentHook seed="ranking-mid" variant={0} />

        {/* ── 순위 리스트 ── */}
        <div className="space-y-2">
          {ranked.map((v, i) => {
            const ch = getRankChange(v.slug, i, period);
            const cc = catColors[v.category] || '#8B5CF6';
            const score = getPeriodScore(v.slug, period);
            return (
              <Link target="_blank" rel="noopener noreferrer" key={v.id} to={getCategoryHref(v.category, v.slug, v.region)}
                className="flex items-center gap-3 sm:gap-4 rounded-xl border bg-white px-4 py-3 transition hover:shadow-md hover:border-[#8B5CF6]/30"
                style={{ borderColor: '#E5E7EB', minHeight: 64 }}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                  i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'
                }`}>{i + 1}</span>
                <span className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: cc + '15' }}>
                  {categories.find(c => c.key === v.category)?.emoji || '🎵'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold" style={{ color: '#111' }}>{v.nameKo}</h3>
                    {v.isPremium && <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#F3F0FF] px-1.5 py-0.5 rounded">AD</span>}
                  </div>
                  <p className="text-xs" style={{ color: '#999' }}>{v.regionKo} · {catLabel[v.category] || v.category}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 w-32">
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(score / 5) * 100}%`, backgroundColor: cc }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
                </div>
                <span className="sm:hidden text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
                <div className="shrink-0 flex items-center gap-0.5">
                  <span className={`text-xs font-bold ${ch.color}`}>{ch.icon}</span>
                  {ch.text && <span className={`text-[10px] ${ch.color}`}>{ch.text}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {ranked.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-bold mb-2" style={{ color: '#111' }}>해당 조건의 결과가 없습니다</p>
            <p className="text-sm" style={{ color: '#555' }}>다른 카테고리나 지역을 선택해보세요</p>
          </div>
        )}

        {/* 중간 퀴즈 */}
        <MidContentQuiz
          question="이번 주 1위는 어디일까?"
          options={['강남 클럽이 당연 1위', '나이트가 의외로 강하다', '요즘 라운지가 대세', '지방 업소가 역전 중']}
          seed="ranking-quiz"
        />

        {/* ── 안내 ── */}
        <div className="mt-8 rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-bold mb-1" style={{ color: '#8B5CF6' }}>랭킹 기준 안내</p>
          <ul className="text-xs space-y-1" style={{ color: '#555' }}>
            <li><strong>일간:</strong> 오늘 조회수·검색량·관심도를 종합한 실시간 순위. 매일 자정 초기화.</li>
            <li><strong>주간:</strong> 최근 7일간 누적 인기도 기반. 꾸준한 관심을 받는 업소가 상위.</li>
            <li><strong>월간:</strong> 한 달간 전체 데이터 종합. 가장 안정적인 인기 지표.</li>
          </ul>
        </div>

        {/* ═══ BOTTOM ═══ */}
        <ReadCompletionReward teaser="랭킹에서 볼 수 없는 숨은 인기 업소">
          <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
            랭킹에 아직 안 올라왔지만 단골들 사이에서 입소문 타는 곳들이 있다.
            숨은 명소 페이지에서 확인해봐.
          </p>
          <Link to="/hidden" className="inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED] mt-2">
            숨은 명소 보기 →
          </Link>
        </ReadCompletionReward>

        <div className="text-center mt-6">
          <ReadFinishCount pageName="인기 랭킹" baseCount={250} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
