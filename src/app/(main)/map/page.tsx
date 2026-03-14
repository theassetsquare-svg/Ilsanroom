"use client";

import { useState } from "react";

const regions = [
  {
    name: "서울",
    areas: [
      { name: "강남", count: 24 },
      { name: "홍대", count: 18 },
      { name: "이태원", count: 12 },
      { name: "청담", count: 8 },
      { name: "신림", count: 5 },
      { name: "건대", count: 7 },
    ],
  },
  {
    name: "부산",
    areas: [
      { name: "해운대", count: 15 },
      { name: "서면", count: 9 },
      { name: "경성대", count: 6 },
    ],
  },
  {
    name: "경기",
    areas: [
      { name: "일산", count: 4 },
      { name: "수원", count: 3 },
      { name: "파주", count: 2 },
    ],
  },
  {
    name: "기타",
    areas: [
      { name: "대구", count: 5 },
      { name: "대전", count: 3 },
      { name: "인천", count: 4 },
      { name: "울산", count: 2 },
    ],
  },
];

export default function MapPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>("서울");

  const currentRegion = regions.find((r) => r.name === selectedRegion);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            <span className="text-violet-400">지도</span>로 찾기
          </h1>
          <p className="text-lg text-neutral-400">
            지역별 나이트라이프 업소를 탐색하세요
          </p>
        </div>

        <div className="mb-8 flex justify-center gap-3">
          {regions.map((region) => (
            <button
              key={region.name}
              onClick={() => setSelectedRegion(region.name)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                selectedRegion === region.name
                  ? "bg-violet-600 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>

        <div className="mb-10 flex items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20">
              <span className="text-3xl">🗺️</span>
            </div>
            <p className="text-lg font-medium text-neutral-300">
              지도 서비스 준비 중
            </p>
            <p className="text-sm text-neutral-500">
              네이버/카카오 지도 API 연동이 곧 제공될 예정입니다
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-bold">
            {selectedRegion} 지역 업소
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentRegion?.areas.map((area) => (
              <div
                key={area.name}
                className="group flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-violet-500/50"
              >
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-violet-400">
                    {area.name}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    등록 업소 {area.count}곳
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400">
                  →
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="mb-4 text-lg font-bold">빠른 검색</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="지역명 또는 업소명 검색..."
              className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-violet-500"
            />
            <button className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium transition hover:bg-violet-500">
              검색
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
