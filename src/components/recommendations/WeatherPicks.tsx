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
      { name: '문 라운지 압구정', reason: '감성 루프탑 라운지', link: '/lounges/moon-lounge-apgujeong' },
    ],
  },
  rain: {
    type: 'rain',
    icon: '🌧️',
    title: '비 오는 밤엔 실내 라운지',
    description: '비 오는 날 분위기 있는 실내 공간을 추천해요',
    venues: [
      { name: 'DM 라운지', reason: '논현 하이엔드 라운지', link: '/lounges/dm-lounge' },
      { name: '코드 라운지 강남', reason: '재즈와 함께하는 모던 라운지', link: '/lounges/code-lounge-gangnam' },
      { name: '일산명월관요정', reason: '빗소리와 국악이 어우러지는 전통 공간', link: '/yojeong/ilsan/ilsan-myeongwolgwan-yojeong' },
    ],
  },
  cloudy: {
    type: 'cloudy',
    icon: '☁️',
    title: '흐린 날엔 분위기 있는 곳으로',
    description: '아늑한 실내 공간을 추천합니다',
    venues: [
      { name: '펄 라운지 청담', reason: '럭셔리한 분위기', link: '/lounges/pearl-lounge-cheongdam' },
      { name: '일산룸', reason: '프라이빗한 모임 공간', link: '/rooms/ilsan/ilsan-room' },
    ],
  },
  snow: {
    type: 'snow',
    icon: '❄️',
    title: '눈 오는 날의 특별한 밤',
    description: '따뜻한 실내에서 즐기는 나이트라이프',
    venues: [
      { name: '일산명월관요정', reason: '따뜻한 한정식과 국악', link: '/yojeong/ilsan/ilsan-myeongwolgwan-yojeong' },
      { name: '강남 라운지 아르주', reason: '프리미엄 실내 라운지', link: '/lounges/gangnam-lounge-arzu' },
    ],
  },
  hot: {
    type: 'hot',
    icon: '🥵',
    title: '더운 날엔 시원한 실내로',
    description: '에어컨 빵빵한 곳에서 즐기세요',
    venues: [
      { name: '클럽 옥타곤', reason: '지하 대형 클럽, 시원한 실내', link: '/clubs/gangnam/club-octagon' },
    ],
  },
  cold: {
    type: 'cold',
    icon: '🥶',
    title: '추운 날엔 따뜻한 실내에서',
    description: '따뜻하게 즐길 수 있는 곳을 추천해요',
    venues: [
      { name: '일산명월관요정', reason: '온돌과 따뜻한 한정식', link: '/yojeong/ilsan/ilsan-myeongwolgwan-yojeong' },
      { name: 'DM 라운지', reason: '프라이빗한 따뜻한 공간', link: '/lounges/dm-lounge' },
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
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{weather.title}</h2>
              <p className="text-sm text-neutral-500">{weather.description}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weather.venues.map((venue) => (
              <Link
                key={venue.name}
                href={venue.link}
                className="group flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition hover:border-violet-500/40 hover:bg-neutral-900"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white group-hover:text-violet-400 transition">{venue.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{venue.reason}</p>
                </div>
                <span className="text-neutral-700 group-hover:text-violet-400 transition">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
