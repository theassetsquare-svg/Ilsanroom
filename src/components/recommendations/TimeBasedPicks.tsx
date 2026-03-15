'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TimeSlot {
  range: string;
  greeting: string;
  emoji: string;
  courses: { title: string; venues: string[]; links: string[] }[];
}

const TIME_SLOTS: TimeSlot[] = [
  {
    range: '6-11', // 6am - 11am
    greeting: '좋은 아침이에요',
    emoji: '☀️',
    courses: [],
  },
  {
    range: '11-17', // 11am - 5pm
    greeting: '활기찬 오후네요',
    emoji: '🌤️',
    courses: [],
  },
  {
    range: '17-20', // 5pm - 8pm
    greeting: '저녁 시간이에요',
    emoji: '🌆',
    courses: [
      { title: '저녁 식사 + 요정 코스', venues: ['일산명월관요정', '압구정라운지 디엠'], links: ['/yojeong/ilsan/ilsanmyeongwolgwanyojeong', '/lounges/apgujeong-dm'] },
      { title: '비즈니스 접대 코스', venues: ['일산룸', '해운대고구려'], links: ['/rooms/ilsan/ilsanroom', '/rooms/busan-haeundae/haeundaegoguryeo'] },
    ],
  },
  {
    range: '20-23', // 8pm - 11pm
    greeting: '밤이 시작됩니다',
    emoji: '🌙',
    courses: [
      { title: '나이트 입문 코스', venues: ['수원찬스돔나이트', '강남클럽 레이스'], links: ['/nights/suwonchansdomnight', '/clubs/gangnam/gangnamclub-race'] },
      { title: '프리미엄 룸 코스', venues: ['일산룸', '해운대고구려'], links: ['/rooms/ilsan/ilsanroom', '/rooms/busan-haeundae/haeundaegoguryeo'] },
    ],
  },
  {
    range: '23-6', // 11pm - 6am
    greeting: '지금이 가장 뜨거운 시간',
    emoji: '🔥',
    courses: [
      { title: '지금 핫한 클럽', venues: ['강남클럽 레이스', '강남클럽 사운드', '압구정클럽 하입'], links: ['/clubs/gangnam/gangnamclub-race', '/clubs/gangnam/gangnamclub-sound', '/clubs/apgujeong/apgujeongclub-hype'] },
      { title: '호빠 투어', venues: ['강남호빠 로얄', '압구정라운지 디엠'], links: ['/hoppa/gangnam-hoppa-royal', '/lounges/apgujeong-dm'] },
    ],
  },
];

function getCurrentSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return TIME_SLOTS[0];
  if (hour >= 11 && hour < 17) return TIME_SLOTS[1];
  if (hour >= 17 && hour < 20) return TIME_SLOTS[2];
  if (hour >= 20 && hour < 23) return TIME_SLOTS[3];
  return TIME_SLOTS[4]; // 23-6
}

export default function TimeBasedPicks() {
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [hour, setHour] = useState(0);

  useEffect(() => {
    const now = new Date();
    setHour(now.getHours());
    setSlot(getCurrentSlot());
  }, []);

  if (!slot) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{slot.emoji}</span>
          <div>
            <h2 className="text-xl font-bold text-neon-text">{slot.greeting}</h2>
            <p className="text-sm text-neon-text/50">
              지금 시각 {hour}시 — 이런 곳은 어떠세요?
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {slot.courses.map((course) => (
          <div
            key={course.title}
            className="rounded-2xl border border-neon-border bg-neon-surface p-6"
          >
            <h3 className="mb-4 text-lg font-bold text-violet-400">{course.title}</h3>
            <div className="space-y-3">
              {course.venues.map((name, i) => (
                <Link
                  key={name}
                  href={course.links[i]}
                  className="flex items-center gap-3 rounded-xl bg-neon-surface/80 border border-neon-border/50 px-4 py-3 transition hover:border-violet-500/50 hover:bg-neon-surface"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-neon-text">{name}</span>
                  <span className="ml-auto text-xs text-neon-text/40">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
