import { Link } from 'react-router-dom';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  href?: string;
  newTab?: boolean;
  hover?: boolean;
}

export default function Card({ className = '', children, href, newTab = true, hover = true }: CardProps) {
  const classes = `rounded-2xl border border-neon-border bg-white p-5 transition-all duration-200 ${hover ? 'card-hover' : ''} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className={`block cursor-pointer ${classes}`}
      >
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
