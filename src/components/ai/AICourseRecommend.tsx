import { useState } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

const presets = [
  { label: '홍대 저녁~밤', region: '홍대', time: 'evening' },
  { label: '강남 올나잇', region: '강남', time: 'night' },
  { label: '일산 접대 코스', region: '일산', time: 'dinner' },
  { label: '이태원 데이트', region: '이태원', time: 'evening' },
  { label: '부산 바캉스', region: '부산', time: 'evening' },
];

const regionMap: Record<string, string> = {
  '강남': 'gangnam', '홍대': 'hongdae', '이태원': 'itaewon', '일산': 'ilsan',
  '부산': 'busan', '해운대': 'busan-haeundae', '대구': 'daegu',
};

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

function getHref(v: Venue) {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`, night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`, room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`, hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

interface CourseStep {
  time: string;
  label: string;
  venue: Venue;
  description: string;
}

function buildCourse(region: string, timeSlot: string): CourseStep[] {
  const regionCode = regionMap[region] || region;
  const regional = venues.filter(v =>
    v.status !== 'closed_or_unclear' &&
    (v.region.includes(regionCode) || v.regionKo.includes(region))
  );

  if (regional.length === 0) {
    // Fall back to all venues
    const all = venues.filter(v => v.status !== 'closed_or_unclear');
    return buildCourseFromVenues(all, timeSlot);
  }
  return buildCourseFromVenues(regional, timeSlot);
}

function buildCourseFromVenues(pool: Venue[], timeSlot: string): CourseStep[] {
  const steps: CourseStep[] = [];
  const used = new Set<string>();

  const pick = (cats: string[]): Venue | undefined => {
    const candidates = pool.filter(v => cats.includes(v.category) && !used.has(v.id));
    candidates.sort((a, b) => (b.rating * 10 + b.reviewCount) - (a.rating * 10 + a.reviewCount));
    const v = candidates[0];
    if (v) used.add(v.id);
    return v;
  };

  if (timeSlot === 'dinner' || timeSlot === 'evening') {
    const dinner = pick(['yojeong', 'room', 'lounge']);
    if (dinner) steps.push({ time: '18:00', label: '저녁 식사', venue: dinner, description: '분위기 좋은 저녁으로 시작' });
  }

  if (timeSlot === 'evening' || timeSlot === 'night') {
    const drink = pick(['lounge', 'hoppa', 'room']);
    if (drink) steps.push({ time: '21:00', label: '2차 분위기', venue: drink, description: '가벼운 음료와 함께 분위기 전환' });
  }

  const late = pick(['club', 'night', 'lounge']);
  if (late) steps.push({ time: '23:00', label: '메인 파티', venue: late, description: '밤의 하이라이트' });

  if (timeSlot === 'night') {
    const after = pick(['lounge', 'room', 'hoppa']);
    if (after) steps.push({ time: '01:00', label: '애프터', venue: after, description: '마무리까지 완벽하게' });
  }

  return steps;
}

export default function AICourseRecommend() {
  const [region, setRegion] = useState('');
  const [course, setCourse] = useState<CourseStep[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = (r: string, time: string) => {
    setRegion(r);
    setLoading(true);
    setTimeout(() => {
      setCourse(buildCourse(r, time));
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl">🗺️</span>
        <div>
          <h3 className="text-lg font-bold text-neon-text">AI 코스 추천</h3>
          <p className="text-xs text-neon-text-muted">저녁부터 새벽까지, 동선 짜는 게 귀찮잖아요</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handleGenerate(p.region, p.time)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              region === p.region
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100/60 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <span className="text-sm text-amber-600">코스 짜는 중...</span>
        </div>
      )}

      {!loading && course.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-amber-700 mb-4">{region} 추천 코스</p>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-amber-200" />

            <div className="space-y-4">
              {course.map((step, i) => (
                <div key={i} className="relative flex gap-4 pl-2">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <Link to={getHref(step.venue)} className="flex-1 rounded-xl border border-amber-100 bg-white p-4 transition hover:shadow-md hover:border-amber-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-amber-600">{step.time}</span>
                      <span className="text-xs text-neon-text-muted">·</span>
                      <span className="text-xs font-medium text-neon-text">{step.label}</span>
                    </div>
                    <h4 className="text-sm font-bold text-neon-text">{step.venue.nameKo}</h4>
                    <p className="text-xs text-neon-text-muted mt-1">{step.description}</p>
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-600">{getCategoryLabel(step.venue.category)}</span>
                      <span className="text-amber-600">★ {step.venue.rating}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
