import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - 일산룸포털",
  description: "일산룸포털에 가입하고 다양한 나이트라이프 정보를 만나보세요.",
};

export default function SignupPage() {
  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-neon-text">회원가입</h1>

      <form className="space-y-4">
        <div>
          <label htmlFor="nickname" className="mb-1.5 block text-sm font-medium text-neon-text">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            placeholder="닉네임 입력 (2~12자)"
            className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neon-text">
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@email.com"
            className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neon-text">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            placeholder="8자 이상, 영문+숫자 조합"
            className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label htmlFor="passwordConfirm" className="mb-1.5 block text-sm font-medium text-neon-text">
            비밀번호 확인
          </label>
          <input
            id="passwordConfirm"
            type="password"
            placeholder="비밀번호 다시 입력"
            className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text placeholder-neutral-500 outline-none transition focus:border-violet-500"
          />
        </div>

        <div>
          <label htmlFor="birthYear" className="mb-1.5 block text-sm font-medium text-neon-text">
            출생연도
          </label>
          <select
            id="birthYear"
            className="w-full rounded-xl border border-neon-border bg-neon-bg px-4 py-3 text-sm text-neon-text-muted outline-none transition focus:border-violet-500"
          >
            <option value="">출생연도 선택</option>
            {Array.from({ length: 40 }, (_, i) => 2007 - i).map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-start gap-2 text-sm text-neon-text-muted">
            <input type="checkbox" className="mt-1 rounded border-neutral-600 bg-neon-surface-2" />
            <span>(필수) 만 19세 이상입니다</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neon-text-muted">
            <input type="checkbox" className="mt-1 rounded border-neutral-600 bg-neon-surface-2" />
            <span>(필수) 이용약관에 동의합니다</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neon-text-muted">
            <input type="checkbox" className="mt-1 rounded border-neutral-600 bg-neon-surface-2" />
            <span>(필수) 개인정보 수집 및 이용에 동의합니다</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neon-text-muted">
            <input type="checkbox" className="mt-1 rounded border-neutral-600 bg-neon-surface-2" />
            <span>(선택) 마케팅 정보 수신에 동의합니다</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neon-primary py-3 font-medium text-neon-text transition hover:bg-neon-primary-light"
        >
          가입하기
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neon-text-muted">
        이미 계정이 있으신가요?{" "}
        <a href="/login" className="font-medium text-neon-primary-light hover:underline">
          로그인
        </a>
      </p>
    </div>
  );
}
