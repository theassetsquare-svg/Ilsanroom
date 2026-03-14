export default function AnalyticsPage() {
  const stats = [
    { label: "총 페이지뷰", value: "12,847", change: "+14.2%", up: true },
    { label: "검색 노출", value: "8,392", change: "+8.7%", up: true },
    { label: "클릭률", value: "3.2%", change: "-0.4%", up: false },
    { label: "리뷰 수", value: "156", change: "+23", up: true },
  ];

  const chartData = [
    { label: "월", value: 65 },
    { label: "화", value: 80 },
    { label: "수", value: 45 },
    { label: "목", value: 90 },
    { label: "금", value: 100 },
    { label: "토", value: 75 },
    { label: "일", value: 55 },
  ];

  const keywords = [
    { keyword: "일산 룸", impressions: "2,341", clicks: "187", ctr: "8.0%" },
    { keyword: "일산 요정", impressions: "1,892", clicks: "134", ctr: "7.1%" },
    { keyword: "일산 노래방", impressions: "1,204", clicks: "89", ctr: "7.4%" },
    { keyword: "일산 2차", impressions: "987", clicks: "52", ctr: "5.3%" },
    { keyword: "일산 룸싸롱", impressions: "756", clicks: "41", ctr: "5.4%" },
  ];

  const trafficSources = [
    { source: "네이버 검색", percentage: 42, color: "bg-violet-500" },
    { source: "구글 검색", percentage: 28, color: "bg-violet-400" },
    { source: "직접 방문", percentage: 18, color: "bg-violet-300" },
    { source: "SNS 유입", percentage: 8, color: "bg-violet-200" },
    { source: "기타", percentage: 4, color: "bg-neutral-500" },
  ];

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="mt-1 text-sm text-neutral-400">
          업소 페이지의 상세 트래픽과 성과를 확인합니다.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
          >
            <p className="text-sm text-neutral-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p
              className={`mt-1 text-xs font-medium ${
                stat.up ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stat.change} 지난달 대비
            </p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold">주간 페이지뷰</h2>
        <p className="mt-1 text-sm text-neutral-400">최근 7일 방문 추이</p>
        <div className="mt-6 flex items-end gap-3" style={{ height: 200 }}>
          {chartData.map((bar) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs text-neutral-400">{bar.value}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400 transition-all"
                style={{
                  height: `${(bar.value / maxChartValue) * 160}px`,
                }}
              />
              <span className="text-xs text-neutral-500">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Search Keywords */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold">인기 검색 키워드</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-neutral-400">
                  <th className="pb-3 pr-4 font-medium">키워드</th>
                  <th className="pb-3 pr-4 font-medium">노출</th>
                  <th className="pb-3 pr-4 font-medium">클릭</th>
                  <th className="pb-3 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {keywords.map((row) => (
                  <tr key={row.keyword} className="text-neutral-300">
                    <td className="py-2.5 pr-4 font-medium text-white">
                      {row.keyword}
                    </td>
                    <td className="py-2.5 pr-4">{row.impressions}</td>
                    <td className="py-2.5 pr-4">{row.clicks}</td>
                    <td className="py-2.5 text-violet-400">{row.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold">트래픽 소스</h2>
          <div className="mt-4 space-y-4">
            {trafficSources.map((src) => (
              <div key={src.source}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300">{src.source}</span>
                  <span className="font-medium">{src.percentage}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className={`h-full rounded-full ${src.color} transition-all`}
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
