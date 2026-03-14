export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neon-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-block text-2xl font-black text-neon-primary neon-glow">
            오늘밤어디
          </a>
          <p className="mt-2 text-sm text-neon-text-muted">오늘밤어디</p>
        </div>
        <div className="rounded-2xl border border-neon-border bg-neon-surface p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-neon-text-muted/60">
          계속 진행하면 오늘밤어디의{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-neon-primary-light hover:underline">이용약관</a> 및{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-primary-light hover:underline">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
