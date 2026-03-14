import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: ReactNode;
  trend: 'up' | 'down';
  className?: string;
}

function Sparkline() {
  const bars = [35, 55, 40, 70, 50, 80, 65];

  return (
    <div className="flex items-end gap-0.5" aria-hidden="true">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1 rounded-sm bg-neon-primary/40 transition-all duration-300"
          style={{ height: `${height}%`, maxHeight: '24px', minHeight: '4px' }}
        />
      ))}
    </div>
  );
}

export default function MetricCard({
  title,
  value,
  change,
  icon,
  trend,
  className = '',
}: MetricCardProps) {
  const isPositive = trend === 'up';
  const changeColor = isPositive ? 'text-neon-green' : 'text-neon-red';
  const changePrefix = isPositive ? '+' : '';
  const arrowPath = isPositive
    ? 'M5 10l7-7m0 0l7 7m-7-7v18'
    : 'M19 14l-7 7m0 0l-7-7m7 7V3';

  return (
    <div
      className={`group rounded-2xl border border-neon-border bg-neon-surface p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--neon-primary-rgb,99,102,241),0.15)] ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-primary/10 text-neon-primary transition-colors group-hover:bg-neon-primary/20">
          {icon}
        </div>
        <Sparkline />
      </div>

      <p className="mb-1 text-sm text-neon-text-muted">{title}</p>

      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-neon-text">{value}</span>
        <div className={`flex items-center gap-0.5 text-sm font-medium ${changeColor}`}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={arrowPath}
            />
          </svg>
          <span>
            {changePrefix}
            {change}%
          </span>
        </div>
      </div>
    </div>
  );
}
