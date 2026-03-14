import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - 페이지를 찾을 수 없습니다 | NEON",
  description: "요청하신 페이지를 찾을 수 없습니다.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
      <div className="mb-8">
        <h1 className="mb-2 text-8xl font-black tracking-tighter">
          <span className="inline-block animate-pulse text-violet-600/30">4</span>
          <span className="inline-block text-violet-600/20">0</span>
          <span className="inline-block animate-pulse text-violet-600/30" style={{ animationDelay: "0.5s" }}>4</span>
        </h1>
        <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-violet-600/50 to-transparent" />
      </div>

      <h2 className="mb-3 text-2xl font-bold text-white">
        여기는 아무것도 없어요
      </h2>
      <p className="mb-2 text-neutral-400">
        네온사인이 꺼진 곳에 도착하셨습니다.
      </p>
      <p className="mb-8 text-sm text-neutral-500">
        찾으시는 페이지가 이동되었거나 존재하지 않는 주소입니다.
      </p>

      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500"
        >
          홈으로 돌아가기
        </Link>
        <Link
          href="/map"
          className="rounded-xl border border-neutral-700 px-6 py-3 font-medium text-neutral-300 transition hover:bg-neutral-900"
        >
          업소 찾아보기
        </Link>
      </div>

      <div className="mt-16 text-neutral-800">
        <p className="text-xs">NEON - 대한민국 나이트라이프 포털</p>
      </div>
    </div>
  );
}
