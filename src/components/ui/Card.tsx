import Link from 'next/link';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  href?: string;
  newTab?: boolean;
  hover?: boolean;
}

export default function Card({ className = '', children, href, newTab = true, hover = true }: CardProps) {
  const classes = `glass rounded-2xl p-5 transition-all duration-300 neon-box-glow-hover ${hover ? 'card-hover' : ''} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className={`block ${classes}`}
      >
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
