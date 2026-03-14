import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - 일산룸포털",
  description: "일산룸포털 계정에 로그인하세요.",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-white">로그인</h1>

      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-300">
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@email.com"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-300">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            placeholder="비밀번호 입력"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input type="checkbox" className="rounded border-neutral-600 bg-neutral-800" />
            로그인 유지
          </label>
          <a href="#" className="text-sm text-violet-400 hover:underline">
            비밀번호 찾기
          </a>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-violet-600 py-3 font-medium text-white transition hover:bg-violet-500"
        >
          로그인
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-800" />
        <span className="text-xs text-neutral-500">또는</span>
        <div className="h-px flex-1 bg-neutral-800" />
      </div>

      <div className="space-y-3">
        <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
          <span className="text-lg">💛</span>
          카카오로 시작하기
        </button>
        <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
          <span className="text-lg">🟢</span>
          네이버로 시작하기
        </button>
        <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
          <span className="text-lg">G</span>
          Google로 시작하기
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-400">
        아직 회원이 아니신가요?{" "}
        <a href="/signup" className="font-medium text-violet-400 hover:underline">
          회원가입
        </a>
      </p>
    </div>
  );
}
