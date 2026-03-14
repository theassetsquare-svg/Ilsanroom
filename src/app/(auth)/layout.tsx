export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-block text-3xl font-bold text-white">
            <span className="text-violet-400">NEON</span>
          </a>
          <p className="mt-2 text-sm text-neutral-500">나이트라이프 포털</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-neutral-600">
          계속 진행하면 NEON의{" "}
          <a href="#" className="text-violet-400 hover:underline">이용약관</a> 및{" "}
          <a href="#" className="text-violet-400 hover:underline">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
