import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: '이벤트 & 파티 캘린더 | 오늘밤어디',
  description: '최신 나이트라이프 이벤트와 파티 일정. 클럽, 나이트, 라운지 이벤트 총정리.',
};

const events = [
  { id: 'e1', title: '강남 클럽 레이스 EDM 파티', venue: '강남클럽레이스', date: '2026-03-21', time: '23:00', region: '강남', category: '클럽' },
  { id: 'e2', title: '홍대 NB2 힙합 나이트', venue: '클럽NB2', date: '2026-03-22', time: '22:00', region: '홍대', category: '클럽' },
  { id: 'e3', title: '일산명월관요정 봄 한정식 특별 코스', venue: '일산명월관요정', date: '2026-03-25', time: '18:00', region: '일산', category: '요정' },
  { id: 'e4', title: '수원찬스돔 주말 스페셜', venue: '수원찬스돔나이트', date: '2026-03-29', time: '20:00', region: '수원', category: '나이트' },
  { id: 'e5', title: '부산 클럽806 스프링 페스티벌', venue: '부산클럽806', date: '2026-04-05', time: '23:00', region: '부산', category: '클럽' },
  { id: 'e6', title: '청담 H2O 나이트 VIP 이벤트', venue: '청담H2O나이트', date: '2026-04-12', time: '20:00', region: '청담', category: '나이트' },
];

const months = ['3월', '4월'];

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Event JSON-LD */}
      {events.map((e) => (
        <JsonLd key={e.id} data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: e.title,
          startDate: `${e.date}T${e.time}:00+09:00`,
          location: { '@type': 'Place', name: e.venue, address: { '@type': 'PostalAddress', addressCountry: 'KR' } },
          organizer: { '@type': 'Organization', name: '오늘밤어디', url: 'https://ilsanroom.pages.dev' },
        }} />
      ))}

      <h1 className="text-3xl font-extrabold text-neon-text mb-2">이벤트 & 파티 캘린더</h1>
      <p className="text-neon-text-muted mb-10">전국 나이트라이프 이벤트 일정</p>

      {/* Calendar-style month sections */}
      {months.map((month) => {
        const monthEvents = events.filter((e) => (month === '3월' && e.date.startsWith('2026-03')) || (month === '4월' && e.date.startsWith('2026-04')));
        return (
          <div key={month} className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-neon-primary-light">{month} 2026</h2>
            <div className="space-y-3">
              {monthEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-4 rounded-xl border border-neon-border bg-neon-surface px-5 py-4 card-hover">
                  <div className="shrink-0 text-center">
                    <p className="text-2xl font-bold text-neon-text">{e.date.split('-')[2]}</p>
                    <p className="text-xs text-neon-text-muted">{month}</p>
                  </div>
                  <div className="h-10 w-px bg-neon-border" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-neon-text">{e.title}</h3>
                    <p className="text-xs text-neon-text-muted">{e.venue} · {e.region} · {e.time}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-neon-primary/10 px-3 py-1 text-xs text-neon-primary-light">{e.category}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
