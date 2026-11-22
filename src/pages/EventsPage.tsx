import NcH1 from '@/components/seo/NcH1';
import { useRef } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import JsonLd from '@/components/seo/JsonLd';
import { ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { Link } from '../components/ui/SafeLink';

type EventItem = {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  region: string;
  category: string;
  desc: string;
};

// 가게에서 확인된 행사만 넣는다.
const events: EventItem[] = [];

const categoryLinks = [
  { to: '/clubs', label: '클럽' },
  { to: '/nights', label: '나이트' },
  { to: '/lounges', label: '라운지' },
  { to: '/rooms', label: '룸' },
  { to: '/yojeong', label: '요정' },
  { to: '/hoppa', label: '호빠' },
];

export default function EventsPage() {
  useDocumentMeta('행사 일정 — 가게에서 확인된 일정만 싣는다', '가게에서 확인한 행사 일정만 싣는 페이지입니다. 아직 올라온 행사가 없어, 그 전까지는 각 가게 페이지에서 가게 소개를 먼저 보세요.');
  const containerRef = useRef<HTMLDivElement>(null);

  // 곧 다가오는 이벤트
  const now = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter(e => e.date >= now).slice(0, 2);

  return (
    <div ref={containerRef}>
      {/* Event JSON-LD */}
      {events.map((e) => (
        <JsonLd key={e.id} data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: e.title,
          description: e.desc,
          startDate: `${e.date}T${e.time}:00+09:00`,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          eventStatus: 'https://schema.org/EventScheduled',
          location: { '@type': 'Place', name: e.venue, address: { '@type': 'PostalAddress', addressRegion: e.region, addressCountry: 'KR' } },
          organizer: { '@type': 'Organization', name: '놀쿨', url: 'https://nolcool.com' },
        }} />
      ))}

      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 40% 40%, #EC4899 0%, transparent 40%), radial-gradient(circle at 60% 60%, #8B5CF6 0%, transparent 40%)' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <NcH1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            📅 행사 일정<br />
            <span style={{ color: '#EC4899' }}>가게에서 확인된 일정만</span>
          </NcH1>

          {/* 다가오는 이벤트 하이라이트 */}
          {upcomingEvents.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {upcomingEvents.map(e => (
                <div key={e.id} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-5 py-3 flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-black leading-none" style={{ color: '#FFFFFF' }}>{e.date.split('-')[2]}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{e.date.split('-')[1]}월</p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{e.title}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{e.venue} · {e.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ EVENTS ═══ */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {events.length === 0 ? (
          <section className="mb-10 rounded-xl border border-gray-200 bg-white px-5 py-8 shadow-sm" aria-labelledby="events-empty-heading">
            <h2 id="events-empty-heading" className="mb-3 text-lg font-bold text-[#111]">등록된 행사가 아직 없습니다</h2>
            <p className="mb-5 text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              가게에서 확인된 행사 일정만 이 페이지에 올립니다. 그 전까지는 각 가게 페이지에서 가게 소개를 확인하세요.
            </p>
            <ul className="flex flex-wrap gap-2">
              {categoryLinks.map((c) => (
                <li key={c.to}>
                  <Link to={c.to} className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-[#8B5CF6] hover:border-[#8B5CF6]/40 hover:text-[#7C3AED]">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="mb-10">
            <div className="space-y-2.5">
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-5 shadow-sm">
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-xl font-bold text-[#111] leading-tight">{e.date.split('-')[2]}</p>
                    <p className="text-xs text-[#999]">{e.date.split('-')[1]}월</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#111] mb-1">{e.title}</h3>
                    <p className="text-xs text-[#555] line-clamp-2 mb-1" style={{ lineHeight: '1.6' }}>{e.desc}</p>
                    <p className="text-xs text-[#999]">{e.venue} · {e.region} · {e.time}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#8B5CF6]/10 px-2.5 py-1 text-xs font-bold text-[#8B5CF6] self-start">{e.category}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
