type BadgeVariant = 'default' | 'premium' | 'verified' | 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa' ;

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neon-surface-2 text-neon-text-muted border-neon-border',
  premium: 'bg-neon-gold/10 text-neon-gold border-neon-gold/30',
  verified: 'bg-neon-green/10 text-neon-green border-neon-green/30',
  club: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  night: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  lounge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  room: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  yojeong: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  hoppa: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
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
