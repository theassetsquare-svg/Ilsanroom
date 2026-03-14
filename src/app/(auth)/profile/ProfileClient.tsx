"use client";

import { useState } from "react";

export default function ProfileClient() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | null>(null);

  const handleExport = (format: "json" | "csv") => {
    setExportFormat(format);
    // Simulated export — in production this would trigger an API call
    setTimeout(() => setExportFormat(null), 2000);
  };

  const handleDeleteRequest = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <div>
      <h1 className="mb-8 text-center text-2xl font-bold text-white">
        내 프로필
      </h1>

      {/* Avatar section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-600/20 text-3xl">
            &#128100;
          </div>
          <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-800 bg-violet-600 text-xs text-white transition hover:bg-violet-500">
            &#9998;
          </button>
        </div>
        <p className="text-sm text-neutral-400">
          프로필 사진을 변경하려면 편집 버튼을 누르세요
        </p>
      </div>

      {/* Profile form */}
      <form className="space-y-5">
        <div>
          <label
            htmlFor="nickname"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            placeholder="닉네임을 입력하세요"
            defaultValue="NEON_User"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@email.com"
            defaultValue="user@example.com"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            이메일 변경 시 인증이 필요합니다
          </p>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            휴대전화
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="010-0000-0000"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            선택 사항입니다. 이벤트 알림에 사용됩니다.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-violet-600 py-3 font-medium text-white transition hover:bg-violet-500"
        >
          프로필 저장
        </button>
      </form>

      {/* Divider */}
      <div className="my-8 h-px bg-neutral-800" />

      {/* Subscription status */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-white">구독 상태</h2>
        <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-neutral-300">
                현재 플랜
              </span>
              <p className="text-lg font-bold text-white">무료 플랜</p>
            </div>
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-400">
              FREE
            </span>
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="text-violet-400">&#10003;</span>
              업소 정보 열람
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="text-violet-400">&#10003;</span>
              리뷰 작성 (월 5건)
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>&#10007;</span>
              상세 리뷰 열람
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>&#10007;</span>
              프리미엄 랭킹 접근
            </div>
          </div>

          <a
            href="#"
            className="block w-full rounded-xl border border-violet-500 bg-violet-600/10 py-2.5 text-center text-sm font-medium text-violet-400 transition hover:bg-violet-600/20"
          >
            프리미엄으로 업그레이드
          </a>
        </div>
      </div>

      {/* 일산룸포털 Points */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-white">일산룸포털 포인트</h2>
        <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-neutral-400">보유 포인트</span>
            <span className="text-xl font-bold text-violet-400">0 P</span>
          </div>
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>추천 포인트</span>
            <span>0 P</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-neutral-500">
            <span>활동 포인트</span>
            <span>0 P</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-8 h-px bg-neutral-800" />

      {/* Data Export Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-white">데이터 내보내기</h2>
        <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-5">
          <p className="mb-4 text-sm text-neutral-400">
            리뷰, 댓글, 찜목록을 JSON 또는 CSV로 다운로드할 수 있습니다.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport("json")}
              disabled={exportFormat === "json"}
              className="flex-1 rounded-xl border border-violet-500/50 bg-violet-600/10 py-2.5 text-sm font-medium text-violet-400 transition hover:bg-violet-600/20 disabled:opacity-50"
            >
              {exportFormat === "json" ? "준비 중..." : "JSON 다운로드"}
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={exportFormat === "csv"}
              className="flex-1 rounded-xl border border-violet-500/50 bg-violet-600/10 py-2.5 text-sm font-medium text-violet-400 transition hover:bg-violet-600/20 disabled:opacity-50"
            >
              {exportFormat === "csv" ? "준비 중..." : "CSV 다운로드"}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-8 h-px bg-neutral-800" />

      {/* Account actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-white">계정 관리</h2>
        <div className="space-y-3">
          <button className="w-full rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
            비밀번호 변경
          </button>
          <button className="w-full rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
            로그아웃
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="my-8 h-px bg-red-900/30" />

      {/* Account Deletion Section */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-red-400">회원 탈퇴</h2>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="mt-0.5 text-red-400">&#9888;</span>
            <div>
              <p className="text-sm font-medium text-red-300">
                회원 탈퇴 시 30일간 유예 기간이 주어지며, 이후 모든 데이터가
                영구 삭제됩니다.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                탈퇴 후 30일 이내에 로그인하면 탈퇴가 취소됩니다.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteRequest}
              className="w-full rounded-xl border border-red-500/50 bg-red-600/20 py-3 text-sm font-medium text-red-400 transition hover:bg-red-600/30"
            >
              회원 탈퇴 신청
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-red-300">
                정말 탈퇴하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-700"
                >
                  취소
                </button>
                <button className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-500">
                  탈퇴 확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
