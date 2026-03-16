type BadgeVariant = 'default' | 'premium' | 'verified' | 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neon-surface-2 text-neon-text-muted border-neon-border',
  premium: 'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  club: 'bg-violet-50 text-violet-700 border-violet-200',
  night: 'bg-blue-50 text-blue-700 border-blue-200',
  lounge: 'bg-amber-50 text-amber-700 border-amber-200',
  room: 'bg-rose-50 text-rose-700 border-rose-200',
  yojeong: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  hoppa: 'bg-pink-50 text-pink-700 border-pink-200',
};

export default function Badge({
  variant = 'default',
  className = '',
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
