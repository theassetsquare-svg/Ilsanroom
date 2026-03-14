export default function BillingPage() {
  const paymentHistory = [
    {
      id: "INV-2026-001",
      date: "2026-03-01",
      amount: "₩99,000",
      plan: "프리미엄",
      status: "완료",
    },
    {
      id: "INV-2026-002",
      date: "2026-02-01",
      amount: "₩99,000",
      plan: "프리미엄",
      status: "완료",
    },
    {
      id: "INV-2025-012",
      date: "2026-01-01",
      amount: "₩49,000",
      plan: "스탠다드",
      status: "완료",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">결제관리</h1>
        <p className="mt-1 text-sm text-neon-text-muted">
          구독 플랜 및 결제 내역을 관리합니다.
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-neon-border bg-neon-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neon-text-muted">현재 요금제</p>
            <p className="mt-1 text-2xl font-bold text-neon-primary-light">프리미엄</p>
            <p className="mt-1 text-sm text-neon-text-muted">
              월 ₩99,000 &middot; 모든 기능 포함
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              활성
            </span>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-medium hover:bg-neon-primary-light transition-colors">
            요금제 변경
          </button>
          <button className="rounded-lg border border-neon-border px-4 py-2 text-sm font-medium text-neon-text hover:bg-neon-surface-2 transition-colors">
            구독 취소
          </button>
        </div>
      </div>

      {/* Next Billing Date */}
      <div className="rounded-xl border border-neon-border bg-neon-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neon-text-muted">다음 결제일</p>
            <p className="mt-1 text-lg font-semibold">2026년 4월 1일</p>
            <p className="mt-1 text-sm text-neon-text-muted">
              자동 결제 &middot; ₩99,000
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon-primary/10">
            <svg
              className="h-6 w-6 text-neon-primary-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-xl border border-neon-border bg-neon-surface p-6">
        <h2 className="text-lg font-semibold">결제 수단</h2>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-neon-border bg-neon-surface-2 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-14 items-center justify-center rounded bg-neon-surface-2 text-xs font-bold text-neon-text">
              VISA
            </div>
            <div>
              <p className="text-sm font-medium">**** **** **** 4242</p>
              <p className="text-xs text-neon-text-muted">만료 12/28</p>
            </div>
          </div>
          <button className="text-sm text-neon-primary-light hover:text-violet-300 transition-colors">
            변경
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-xl border border-neon-border bg-neon-surface p-6">
        <h2 className="text-lg font-semibold">결제 내역</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-border text-left text-neon-text-muted">
                <th className="pb-3 pr-4 font-medium">인보이스</th>
                <th className="pb-3 pr-4 font-medium">날짜</th>
                <th className="pb-3 pr-4 font-medium">요금제</th>
                <th className="pb-3 pr-4 font-medium">금액</th>
                <th className="pb-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {paymentHistory.map((row) => (
                <tr key={row.id} className="text-neon-text">
                  <td className="py-3 pr-4 font-mono text-xs">{row.id}</td>
                  <td className="py-3 pr-4">{row.date}</td>
                  <td className="py-3 pr-4">{row.plan}</td>
                  <td className="py-3 pr-4 font-medium text-neon-text">
                    {row.amount}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
