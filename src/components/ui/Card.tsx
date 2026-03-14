import Link from 'next/link';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  href?: string;
}

export default function Card({ className = '', children, href }: CardProps) {
  const classes = `glass rounded-2xl p-5 transition-all duration-300 neon-box-glow-hover ${className}`;

  if (href) {
    return (
      <Link href={href} className={`block ${classes}`}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
