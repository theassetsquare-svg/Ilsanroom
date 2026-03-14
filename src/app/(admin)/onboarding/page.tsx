"use client";

import { useState } from "react";

const steps = [
  { number: 1, label: "업소정보" },
  { number: 2, label: "사진등록" },
  { number: 3, label: "요금제+결제" },
  { number: 4, label: "완료" },
];

const plans = [
  {
    name: "무료",
    price: "0",
    period: "",
    features: ["기본 업소 등록", "월 5건 리뷰 확인", "기본 통계"],
    highlighted: false,
    tag: null,
  },
  {
    name: "베이직",
    price: "29,000",
    period: "/월",
    features: [
      "사진 20장 등록",
      "리뷰 무제한 확인",
      "기본 통계 + 검색 노출",
      "이벤트 3건 등록",
    ],
    highlighted: false,
    tag: null,
  },
  {
    name: "프로",
    price: "49,000",
    period: "/월",
    features: [
      "사진 50장 등록",
      "리뷰 무제한 + 답변",
      "상세 통계 + 경쟁 분석",
      "이벤트 10건 등록",
      "상위 노출 우선권",
    ],
    highlighted: true,
    tag: "14일 무료 체험",
  },
  {
    name: "프리미엄",
    price: "99,000",
    period: "/월",
    features: [
      "사진 무제한",
      "리뷰 관리 + AI 답변",
      "전체 통계 + 리포트",
      "이벤트 무제한",
      "최상위 노출 보장",
      "전담 매니저 배정",
    ],
    highlighted: false,
    tag: "BEST",
  },
];

const categories = [
  { value: "", label: "카테고리를 선택하세요" },
  { value: "room", label: "룸" },
  { value: "yojeong", label: "요정" },
  { value: "karaoke", label: "노래방" },
  { value: "lounge", label: "라운지" },
  { value: "bar", label: "바" },
  { value: "club", label: "클럽" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("프로");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    address: "",
    hours: "",
    description: "",
    ageGroup: "",
    dressCode: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFakeUpload = () => {
    if (photos.length < 10) {
      setPhotos([...photos, `photo_${photos.length + 1}.jpg`]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">업소 등록</h1>
          <p className="mt-1 text-sm text-neutral-400">
            간단한 4단계로 업소를 등록하세요.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      step.number === currentStep
                        ? "bg-violet-600 text-white"
                        : step.number < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      step.number === currentStep
                        ? "text-violet-400"
                        : step.number < currentStep
                        ? "text-green-400"
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
                        ? "bg-green-600"
                        : "bg-neutral-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-semibold">
              <span className="text-violet-400">Step 1.</span> 업소정보 입력
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              기본 업소 정보를 입력해 주세요.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-300">
                  업소명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="업소 이름을 입력하세요"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300">
                  카테고리 <span className="text-red-400">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300">
                  주소 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="예: 경기도 고양시 일산동구 ..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300">
                  영업시간 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  placeholder="예: 18:00 ~ 02:00"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300">
                  소개
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="업소에 대한 간단한 소개를 작성해 주세요"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    주요 연령대
                  </label>
                  <select
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">선택하세요</option>
                    <option value="20s">20대</option>
                    <option value="30s">30대</option>
                    <option value="40s">40대</option>
                    <option value="50+">50대 이상</option>
                    <option value="all">전 연령</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    드레스코드
                  </label>
                  <select
                    name="dressCode"
                    value={formData.dressCode}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">선택하세요</option>
                    <option value="casual">캐주얼</option>
                    <option value="smart">스마트 캐주얼</option>
                    <option value="formal">정장</option>
                    <option value="none">없음</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {currentStep === 2 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-semibold">
              <span className="text-violet-400">Step 2.</span> 사진 등록
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              업소 사진을 등록해 주세요. 최대 10장까지 가능합니다.
            </p>

            {/* Drag & Drop Area */}
            <div
              className={`mt-6 flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                dragOver
                  ? "border-violet-500 bg-violet-600/10"
                  : "border-neutral-700 bg-neutral-800/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFakeUpload();
              }}
            >
              <div className="text-4xl text-neutral-500">📁</div>
              <p className="mt-3 text-sm text-neutral-400">
                사진을 여기에 드래그하거나
              </p>
              <button
                type="button"
                onClick={handleFakeUpload}
                className="mt-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium transition hover:bg-violet-500"
              >
                파일 선택
              </button>
              <p className="mt-2 text-xs text-neutral-500">
                JPG, PNG (최대 5MB 각, 최대 10장) - {photos.length}/10 등록됨
              </p>
            </div>

            {/* Thumbnail Grid */}
            {photos.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">
                  등록된 사진
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square rounded-lg border border-neutral-700 bg-neutral-800"
                    >
                      <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                        {photo}
                      </div>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      >
                        x
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-medium">
                          대표
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Plan & Payment */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-semibold">
                <span className="text-violet-400">Step 3.</span> 요금제 선택 및
                결제
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                비즈니스에 맞는 요금제를 선택하세요.
              </p>

              {/* Plan Cards */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {plans.map((plan) => (
                  <button
                    key={plan.name}
                    type="button"
                    onClick={() => setSelectedPlan(plan.name)}
                    className={`relative rounded-xl border p-5 text-left transition ${
                      selectedPlan === plan.name
                        ? "border-violet-500 bg-violet-600/10"
                        : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                    } ${plan.highlighted ? "ring-1 ring-violet-500" : ""}`}
                  >
                    {plan.tag && (
                      <span
                        className={`absolute -top-2.5 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          plan.highlighted
                            ? "bg-violet-600 text-white"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {plan.tag}
                      </span>
                    )}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <div className="mt-1">
                        <span className="text-2xl font-bold text-violet-400">
                          {plan.price === "0" ? "무료" : `${plan.price}원`}
                        </span>
                        {plan.period && (
                          <span className="text-sm text-neutral-400">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-neutral-300"
                        >
                          <span className="text-violet-400">&#10003;</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {selectedPlan === plan.name && (
                      <div className="mt-3 text-center text-xs font-medium text-violet-400">
                        선택됨
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Form */}
            {selectedPlan !== "무료" && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h3 className="mb-4 font-semibold">결제 정보</h3>
                {selectedPlan === "프로" && (
                  <div className="mb-4 rounded-lg bg-violet-600/10 p-3 text-sm text-violet-300">
                    14일 프로 무료 체험이 적용됩니다. 체험 기간 종료 후 자동
                    결제됩니다.
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300">
                      카드번호
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300">
                        유효기간
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300">
                        CVC
                      </label>
                      <input
                        type="text"
                        placeholder="000"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
            {/* Confetti Animation */}
            <style>{`
              @keyframes confetti-fall {
                0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
              .confetti-piece {
                position: fixed;
                top: 0;
                animation: confetti-fall 3s ease-in-out forwards;
                z-index: 50;
              }
            `}</style>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  width: "8px",
                  height: "8px",
                  borderRadius: Math.random() > 0.5 ? "50%" : "0",
                  backgroundColor: [
                    "#8b5cf6",
                    "#a78bfa",
                    "#c4b5fd",
                    "#22c55e",
                    "#f59e0b",
                    "#ec4899",
                  ][Math.floor(Math.random() * 6)],
                }}
              />
            ))}

            <div className="mb-4 text-6xl">&#127881;</div>
            <h2 className="mb-2 text-2xl font-bold text-violet-400">
              등록 완료!
            </h2>
            <p className="mb-6 text-neutral-400">
              업소 등록이 성공적으로 완료되었습니다.
            </p>

            {/* Registration Summary */}
            <div className="mx-auto mb-8 max-w-md rounded-xl border border-neutral-700 bg-neutral-800 p-5 text-left">
              <h3 className="mb-3 text-sm font-semibold text-neutral-300">
                등록 요약
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">업소명</span>
                  <span className="text-white">
                    {formData.name || "미입력"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">카테고리</span>
                  <span className="text-white">
                    {categories.find((c) => c.value === formData.category)
                      ?.label || "미선택"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">등록 사진</span>
                  <span className="text-white">{photos.length}장</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">선택 요금제</span>
                  <span className="font-medium text-violet-400">
                    {selectedPlan}
                  </span>
                </div>
              </div>
            </div>

            <a
              href="/dashboard"
              className="inline-block rounded-xl bg-violet-600 px-8 py-3 font-medium transition hover:bg-violet-500"
            >
              대시보드로 이동
            </a>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition ${
                currentStep === 1
                  ? "cursor-not-allowed text-neutral-600"
                  : "border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              &larr; 이전
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium transition hover:bg-violet-500"
            >
              {currentStep === 3 ? "등록 완료" : "다음 단계"} &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
