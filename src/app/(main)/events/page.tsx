import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이벤트 & 파티 캘린더 - 일산룸포털",
  description: "최신 나이트라이프 이벤트와 파티 일정을 확인하세요. 클럽, 나이트, 라운지 이벤트 총정리.",
};

const upcomingEvents = [
  {
    id: 1,
    title: "일산룸포털 RAVE: 봄맞이 EDM 페스티벌",
    venue: "Club Race",
    region: "강남",
    date: "2026-03-22",
    time: "22:00",
    category: "페스티벌",
    description: "최정상 DJ 라인업과 함께하는 봄맞이 대형 EDM 파티. 특별 사운드 시스템 세팅.",
    tags: ["EDM", "페스티벌", "대형파티"],
  },
  {
    id: 2,
    title: "DEEP HOUSE NIGHT",
    venue: "M2",
    region: "홍대",
    date: "2026-03-21",
    time: "23:00",
    category: "정규",
    description: "매주 금요일 딥하우스 나이트. 감각적인 사운드로 채워지는 특별한 밤.",
    tags: ["딥하우스", "정규이벤트"],
  },
  {
    id: 3,
    title: "청담 GALA NIGHT",
    venue: "청담 나이트클럽",
    region: "청담",
    date: "2026-03-29",
    time: "20:00",
    category: "갈라",
    description: "라이브 밴드 특별 공연과 함께하는 프리미엄 갈라 나이트. 정장 필수.",
    tags: ["갈라", "라이브", "프리미엄"],
  },
  {
    id: 4,
    title: "SUNSET BEACH PARTY",
    venue: "Cream",
    region: "해운대",
    date: "2026-04-05",
    time: "17:00",
    category: "비치파티",
    description: "해운대 오션뷰 테라스에서 시작하는 선셋 비치 파티. 봄 시즌 오프닝.",
    tags: ["비치파티", "선셋", "오션뷰"],
  },
  {
    id: 5,
    title: "LADIES NIGHT SPECIAL",
    venue: "Lounge Arzu",
    region: "강남",
    date: "2026-03-20",
    time: "21:00",
    category: "레이디스나이트",
    description: "여성 게스트 특별 혜택과 시그니처 칵테일이 준비된 레이디스 나이트.",
    tags: ["레이디스나이트", "칵테일"],
  },
  {
    id: 6,
    title: "RETRO DISCO FEVER",
    venue: "M2",
    region: "홍대",
    date: "2026-04-12",
    time: "22:00",
    category: "테마파티",
    description: "80s-90s 레트로 디스코 테마 파티. 복고풍 드레스코드 환영.",
    tags: ["레트로", "디스코", "테마파티"],
  },
];

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "페스티벌": "bg-violet-500/10 text-violet-400",
    "정규": "bg-blue-500/10 text-blue-400",
    "갈라": "bg-amber-500/10 text-amber-400",
    "비치파티": "bg-cyan-500/10 text-cyan-400",
    "레이디스나이트": "bg-pink-500/10 text-pink-400",
    "테마파티": "bg-orange-500/10 text-orange-400",
  };
  return colors[category] || "bg-neutral-500/10 text-neutral-400";
}

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            이벤트 & 파티 <span className="text-violet-400">캘린더</span>
          </h1>
          <p className="text-lg text-neutral-400">
            놓치지 말아야 할 나이트라이프 이벤트
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {["전체", "페스티벌", "정규", "갈라", "비치파티", "테마파티"].map((tab) => (
            <button
              key={tab}
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-neutral-400 transition hover:bg-neutral-800 hover:text-white first:bg-violet-600 first:text-white"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all hover:border-violet-500/50"
            >
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-violet-600/20 to-neutral-900">
                <span className="text-5xl opacity-50 transition group-hover:opacity-80">
                  🎶
                </span>
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                  <span className="text-xs text-neutral-500">{event.region}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold group-hover:text-violet-400">
                  {event.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                  {event.description}
                </p>
                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <div>
                    <div>📅 {event.date}</div>
                    <div>🕐 {event.time}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-neutral-400">{event.venue}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
