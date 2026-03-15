'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'hot' | 'cold';

interface WeatherRecommendation {
  type: WeatherType;
  icon: string;
  title: string;
  description: string;
  venues: { name: string; reason: string; link: string }[];
}

const WEATHER_RECS: Record<WeatherType, WeatherRecommendation> = {
  clear: {
    type: 'clear',
    icon: '☀️',
    title: '맑은 날씨에 딱!',
    description: '야외 테라스가 있는 곳을 추천드려요',
    venues: [
      { name: '압구정라운지 디엠', reason: '감성 하이엔드 라운지', link: '/lounges/apgujeong-dm' },
      { name: '강남클럽 레이스', reason: '탁 트인 플로어에서 즐기는 나이트', link: '/clubs/gangnam/gangnamclub-race' },
    ],
  },
  rain: {
    type: 'rain',
    icon: '🌧️',
    title: '비 오는 밤엔 실내 라운지',
    description: '비 오는 날 분위기 있는 실내 공간을 추천해요',
    venues: [
      { name: '압구정라운지 디엠', reason: '프라이빗한 하이엔드 라운지', link: '/lounges/apgujeong-dm' },
      { name: '일산명월관요정', reason: '빗소리와 국악이 어우러지는 전통 공간', link: '/yojeong/ilsan/ilsanmyeongwolgwanyojeong' },
      { name: '강남클럽 사운드', reason: '실내에서 즐기는 사운드 클럽', link: '/clubs/gangnam/gangnamclub-sound' },
    ],
  },
  cloudy: {
    type: 'cloudy',
    icon: '☁️',
    title: '흐린 날엔 분위기 있는 곳으로',
    description: '아늑한 실내 공간을 추천합니다',
    venues: [
      { name: '일산룸', reason: '프라이빗한 모임 공간', link: '/rooms/ilsan/ilsanroom' },
      { name: '해운대고구려', reason: '해운대 대표 프리미엄 룸', link: '/rooms/busan-haeundae/haeundaegoguryeo' },
    ],
  },
  snow: {
    type: 'snow',
    icon: '❄️',
    title: '눈 오는 날의 특별한 밤',
    description: '따뜻한 실내에서 즐기는 밤 시간',
    venues: [
      { name: '일산명월관요정', reason: '따뜻한 한정식과 국악', link: '/yojeong/ilsan/ilsanmyeongwolgwanyojeong' },
      { name: '강남호빠 로얄', reason: '프리미엄 실내 호빠', link: '/hoppa/gangnam-hoppa-royal' },
    ],
  },
  hot: {
    type: 'hot',
    icon: '🥵',
    title: '더운 날엔 시원한 실내로',
    description: '에어컨 빵빵한 곳에서 즐기세요',
    venues: [
      { name: '강남클럽 레이스', reason: '시원한 대형 클럽', link: '/clubs/gangnam/gangnamclub-race' },
      { name: '강남클럽 사운드', reason: '쾌적한 실내 클럽', link: '/clubs/gangnam/gangnamclub-sound' },
    ],
  },
  cold: {
    type: 'cold',
    icon: '🥶',
    title: '추운 날엔 따뜻한 실내에서',
    description: '따뜻하게 즐길 수 있는 곳을 추천해요',
    venues: [
      { name: '일산명월관요정', reason: '온돌과 따뜻한 한정식', link: '/yojeong/ilsan/ilsanmyeongwolgwanyojeong' },
      { name: '일산룸', reason: '프라이빗한 따뜻한 공간', link: '/rooms/ilsan/ilsanroom' },
    ],
  },
};

function simulateWeather(): WeatherType {
  // Simulate weather based on month and random
  const month = new Date().getMonth() + 1;
  const rand = Math.random();

  if (month >= 6 && month <= 8) {
    return rand < 0.3 ? 'rain' : rand < 0.5 ? 'hot' : 'clear';
  }
  if (month >= 12 || month <= 2) {
    return rand < 0.2 ? 'snow' : rand < 0.5 ? 'cold' : 'cloudy';
  }
  return rand < 0.3 ? 'rain' : rand < 0.6 ? 'cloudy' : 'clear';
}

export default function WeatherPicks() {
  const [weather, setWeather] = useState<WeatherRecommendation | null>(null);

  useEffect(() => {
    const type = simulateWeather();
    setWeather(WEATHER_RECS[type]);
  }, []);

  if (!weather) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-neon-border bg-gradient-to-r from-neon-surface via-neon-surface-2 to-neon-surface">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-neon-text">{weather.title}</h2>
              <p className="text-sm text-neon-text-muted">{weather.description}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weather.venues.map((venue) => (
              <Link
                key={venue.name}
                href={venue.link}
                className="group flex items-center gap-4 rounded-xl border border-neon-border bg-neon-surface/60 p-4 transition hover:border-neon-primary/40 hover:bg-neon-surface-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-neon-text group-hover:text-neon-primary-light transition">{venue.name}</p>
                  <p className="mt-0.5 text-xs text-neon-text-muted">{venue.reason}</p>
                </div>
                <span className="text-neon-text-muted/40 group-hover:text-neon-primary-light transition">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
