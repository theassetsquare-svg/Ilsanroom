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
    courses: [
      { title: '모닝 콜라텍', venues: ['강남 그랜드 콜라텍', '일산 스타 콜라텍'], links: ['/collatek/gangnam-grand-collatek', '/collatek/ilsan-star-collatek'] },
    ],
  },
  {
    range: '11-17', // 11am - 5pm
    greeting: '활기찬 오후네요',
    emoji: '🌤️',
    courses: [
      { title: '오후 사교댄스', venues: ['영등포 로얄 콜라텍', '해운대 콜라텍'], links: ['/collatek/yeongdeungpo-royal-collatek', '/collatek/busan-haeundae-collatek'] },
    ],
  },
  {
    range: '17-20', // 5pm - 8pm
    greeting: '저녁 시간이에요',
    emoji: '🌆',
    courses: [
      { title: '저녁 식사 + 라운지 코스', venues: ['일산명월관요정', '문 라운지 압구정'], links: ['/yojeong/ilsan/ilsan-myeongwolgwan-yojeong', '/lounges/moon-lounge-apgujeong'] },
      { title: '비즈니스 접대 코스', venues: ['프리미어 룸 강남', '펄 라운지 청담'], links: ['/rooms/gangnam/premier-room-gangnam', '/lounges/pearl-lounge-cheongdam'] },
    ],
  },
  {
    range: '20-23', // 8pm - 11pm
    greeting: '밤이 시작됩니다',
    emoji: '🌙',
    courses: [
      { title: '나이트 입문 코스', venues: ['강남 레이스 나이트', '해운대 스카이 나이트'], links: ['/nights/gangnam-race-night', '/nights/haeundae-sky-night'] },
      { title: '프리미엄 룸 코스', venues: ['일산룸', '강남 바사 룸'], links: ['/rooms/ilsan/ilsan-room', '/rooms/gangnam/basa-gangnam'] },
    ],
  },
  {
    range: '23-6', // 11pm - 6am
    greeting: '지금이 가장 뜨거운 시간',
    emoji: '🔥',
    courses: [
      { title: '지금 핫한 클럽', venues: ['클럽 옥타곤', '클럽 에이스 홍대', '클럽 바이브 이태원'], links: ['/clubs/gangnam/club-octagon', '/clubs/hongdae/club-ace-hongdae', '/clubs/itaewon/club-vibe-itaewon'] },
      { title: '호빠 투어', venues: ['강남 밤사이', '참 호빠 신사'], links: ['/hoppa/bamsai-gangnam', '/hoppa/charm-hoppa-sinsa'] },
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
            <h2 className="text-xl font-bold text-white">{slot.greeting}</h2>
            <p className="text-sm text-neutral-500">
              지금 시각 {hour}시 — 이런 곳은 어떠세요?
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {slot.courses.map((course) => (
          <div
            key={course.title}
            className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6"
          >
            <h3 className="mb-4 text-lg font-bold text-violet-400">{course.title}</h3>
            <div className="space-y-3">
              {course.venues.map((name, i) => (
                <Link
                  key={name}
                  href={course.links[i]}
                  className="flex items-center gap-3 rounded-xl bg-neutral-900/80 px-4 py-3 transition hover:bg-neutral-800"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-neutral-300">{name}</span>
                  <span className="ml-auto text-xs text-neutral-600">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
