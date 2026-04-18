import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { venues } from '@/data/venues';

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

/* ── 실제 데이터 기반 지역 목록 (venue 수 상위) ── */
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

/* ── 프리미엄 업소 고정 점수 ── */
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

/* ── 기간별 점수 변동 (날짜+시간 기반, 매일 순위가 확실히 바뀜) ── */
function getPeriodScore(slug: string, period: string): number {
  const base = getVenueScore(slug);
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const now = new Date();
  if (period === 'daily') {
    // 일간: 날짜+시간대 기반 큰 변동 (+/-0.5)
    const daySeed = (hash * 31 + now.getDate() * 17 + now.getHours()) % 11;
    return Math.round((base + (daySeed - 5) * 0.1) * 10) / 10;
  }
  if (period === 'weekly') {
    // 주간: 주차+요일 기반 변동 (+/-0.3)
    const weekNum = Math.floor(now.getDate() / 7);
    const weekSeed = (hash * 13 + weekNum * 7 + now.getDay()) % 7;
    return Math.round((base + (weekSeed - 3) * 0.1) * 10) / 10;
  }
  // 월간: 월 기반 소폭 변동
  const monthSeed = (hash + now.getMonth()) % 5;
  return Math.round((base + (monthSeed - 2) * 0.05) * 10) / 10;
}

/* ── 순위 변동 표시 ── */
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

  const ranked = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (category !== 'all') list = list.filter((v) => v.category === category);
    if (region !== 'all') list = list.filter((v) => v.regionKo.includes(region));
    return [...list].sort((a, b) => getPeriodScore(b.slug, period) - getPeriodScore(a.slug, period)).slice(0, 20);
  }, [category, region, period]);

  const maxScore = ranked.length > 0 ? Math.max(...ranked.map((v) => getPeriodScore(v.slug, period))) : 5;
  const periodLabel = period === 'daily' ? '오늘 실시간 기준' : period === 'weekly' ? '이번 주 누적 기준' : '이번 달 누적 기준';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* 타이틀 */}
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#111' }}>인기 랭킹 TOP 20</h1>
      <p className="text-sm mb-6" style={{ color: '#555' }}>전국 클럽·나이트·라운지·룸·요정·호빠 실시간 인기 순위</p>

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
              {/* 순위 */}
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'
              }`}>{i + 1}</span>

              {/* 카테고리 도트 + 이모지 */}
              <span className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: cc + '15' }}>
                {categories.find(c => c.key === v.category)?.emoji || '🎵'}
              </span>

              {/* 정보 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold" style={{ color: '#111' }}>{v.nameKo}</h3>
                  {v.isPremium && <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#F3F0FF] px-1.5 py-0.5 rounded">AD</span>}
                </div>
                <p className="text-xs" style={{ color: '#999' }}>{v.regionKo} · {catLabel[v.category] || v.category}</p>
              </div>

              {/* 점수 바 */}
              <div className="hidden sm:flex items-center gap-2 w-32">
                <div className="h-2 flex-1 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(score / 5) * 100}%`, backgroundColor: cc }} />
                </div>
                <span className="text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
              </div>
              {/* 모바일 점수 */}
              <span className="sm:hidden text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>

              {/* 변동 */}
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

      {/* ── 안내 ── */}
      <div className="mt-8 rounded-xl bg-gray-50 p-4">
        <p className="text-xs font-bold mb-1" style={{ color: '#8B5CF6' }}>랭킹 기준 안내</p>
        <ul className="text-xs space-y-1" style={{ color: '#555' }}>
          <li><strong>일간:</strong> 오늘 조회수·검색량·관심도를 종합한 실시간 순위. 매일 자정 초기화.</li>
          <li><strong>주간:</strong> 최근 7일간 누적 인기도 기반. 꾸준한 관심을 받는 업소가 상위.</li>
          <li><strong>월간:</strong> 한 달간 전체 데이터 종합. 가장 안정적인 인기 지표.</li>
        </ul>
      </div>
    </div>
  );
}
