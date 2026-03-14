"use client";

import { useState } from "react";

const steps = [
  { number: 1, label: "업소정보" },
  { number: 2, label: "사진등록" },
  { number: 3, label: "영업시간" },
  { number: 4, label: "요금제선택" },
  { number: 5, label: "완료" },
];

export default function OnboardingPage() {
  const [currentStep] = useState(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">온보딩</h1>
        <p className="mt-1 text-sm text-neutral-400">
          업소 등록을 위한 단계별 안내입니다.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    step.number === currentStep
                      ? "bg-violet-600 text-white"
                      : step.number < currentStep
                      ? "bg-violet-600/20 text-violet-400"
                      : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {step.number < currentStep ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    step.number === currentStep
                      ? "text-violet-400"
                      : "text-neutral-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`mx-2 h-px w-12 sm:w-20 ${
                    step.number < currentStep
                      ? "bg-violet-600"
                      : "bg-neutral-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 Form */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold">
          <span className="text-violet-400">Step 1.</span> 업소정보 입력
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          기본 업소 정보를 입력해 주세요.
        </p>

        <form className="mt-6 space-y-5">
          {/* 업소명 */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              업소명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="업소 이름을 입력하세요"
              className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              카테고리 <span className="text-red-400">*</span>
            </label>
            <select className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500">
              <option value="">카테고리를 선택하세요</option>
              <option value="room">룸</option>
              <option value="yojeong">요정</option>
              <option value="karaoke">노래방</option>
              <option value="lounge">라운지</option>
              <option value="bar">바</option>
            </select>
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              주소 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 경기도 고양시 일산동구 ..."
              className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              전화번호
            </label>
            <input
              type="tel"
              placeholder="000-0000-0000"
              className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* 소개 */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              소개
            </label>
            <textarea
              rows={4}
              placeholder="업소에 대한 간단한 소개를 작성해 주세요"
              className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium hover:bg-violet-500 transition-colors"
            >
              다음 단계 &rarr;
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
