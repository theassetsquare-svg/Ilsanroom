import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: '이벤트 & 파티 캘린더 | 오늘밤어디',
  description: '전국 나이트라이프 업소의 최신 행사·파티 일정을 한눈에. 지역별·업종별 이벤트를 캘린더에서 확인하세요.',
};

const events = [
  { id: 'e1', title: '강남클럽 레이스 EDM 위크엔드', venue: '강남클럽 레이스', date: '2026-03-21', time: '23:00', region: '강남', category: '클럽', desc: '강남 대표 EDM 파티. 해외 게스트 DJ 라인업과 함께하는 주말 페스티벌 분위기.' },
  { id: 'e2', title: '일산명월관요정 봄 한정식 특선', venue: '일산명월관요정', date: '2026-03-25', time: '18:00', region: '일산', category: '요정', desc: '봄 제철 식재료로 구성한 한정식 특선 코스. 국악 라이브 공연 포함.' },
  { id: 'e3', title: '수원찬스돔 주말 스페셜', venue: '수원찬스돔나이트', date: '2026-03-29', time: '20:00', region: '수원', category: '나이트', desc: '돔 구조 사운드홀에서 펼쳐지는 수원 대표 주말 퍼포먼스.' },
  { id: 'e4', title: '부산 연산 물나이트 봄맞이 축제', venue: '부산 연산 물 나이트', date: '2026-04-05', time: '20:00', region: '부산', category: '나이트', desc: '연산동 대형 홀에서 열리는 봄 시즌 개막 축제. 라이브 밴드 3팀 출연.' },
  { id: 'e5', title: '청담H2O 프리미엄 VIP 나이트', venue: '청담H2O나이트', date: '2026-04-12', time: '21:00', region: '청담', category: '나이트', desc: '워터 테마 VIP 전용 이벤트. 프리미엄 양주 테이스팅과 라이브 DJ.' },
  { id: 'e6', title: '대전세븐 7주년 기념 파티', venue: '대전세븐나이트', date: '2026-04-19', time: '20:00', region: '대전', category: '나이트', desc: '7가지 테마 공간을 오픈하는 대전세븐 개업 7주년 특별 행사.' },
];

const months = [
  { label: '2026년 3월', prefix: '2026-03', days: 31, startDay: 0 },
  { label: '2026년 4월', prefix: '2026-04', days: 30, startDay: 3 },
];

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
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
          organizer: { '@type': 'Organization', name: '오늘밤어디', url: 'https://ilsanroom.pages.dev' },
        }} />
      ))}

      <h1 className="text-2xl font-extrabold text-neon-text mb-1">이벤트·파티 캘린더</h1>
      <p className="text-sm text-neon-text-muted mb-8">전국 나이트라이프 업소 행사 일정</p>

      {/* 캘린더 */}
      {months.map((m) => {
        const monthEvents = events.filter((e) => e.date.startsWith(m.prefix));
        const eventDays = new Set(monthEvents.map((e) => parseInt(e.date.split('-')[2])));
        const cells = Array.from({ length: m.startDay }, (_, i) => ({ day: 0, key: `empty-${i}` }))
          .concat(Array.from({ length: m.days }, (_, i) => ({ day: i + 1, key: `d-${i + 1}` })));

        return (
          <section key={m.prefix} className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-neon-primary-light">{m.label}</h2>

            {/* 미니 캘린더 */}
            <div className="mb-4 rounded-xl border border-neon-border bg-neon-surface p-4 overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[280px]">
                {DOW.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-neon-text-muted py-1">{d}</div>
                ))}
                {cells.map((c) => (
                  <div key={c.key} className={`text-center text-xs py-1.5 rounded-lg ${
                    c.day === 0 ? '' : eventDays.has(c.day) ? 'bg-neon-primary/20 text-neon-primary-light font-bold' : 'text-neon-text-muted'
                  }`}>
                    {c.day || ''}
                  </div>
                ))}
              </div>
            </div>

            {/* 이벤트 리스트 */}
            <div className="space-y-2.5">
              {monthEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-4 rounded-xl border border-neon-border bg-neon-surface px-4 py-4 sm:px-5 card-hover" style={{ minHeight: 72 }}>
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-xl font-bold text-neon-text leading-tight">{e.date.split('-')[2]}</p>
                    <p className="text-[10px] text-neon-text-muted">{m.label.slice(6)}</p>
                  </div>
                  <div className="h-10 w-px bg-neon-border shrink-0 self-center" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-neon-text mb-1">{e.title}</h3>
                    <p className="text-xs text-neon-text-muted line-clamp-2 mb-1">{e.desc}</p>
                    <p className="text-[10px] text-neon-text-muted/70">{e.venue} · {e.region} · {e.time}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-neon-primary/10 px-2.5 py-1 text-[10px] text-neon-primary-light self-start">{e.category}</span>
                </div>
              ))}
              {monthEvents.length === 0 && (
                <p className="text-center text-sm text-neon-text-muted py-8">등록된 행사가 없습니다</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
