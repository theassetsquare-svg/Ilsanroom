import { Link } from './SafeLink';

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
    // [놀쿨11-2] 내부 링크는 같은 탭(CLAUDE.md MUST · 새 창 0). 외부 주소만 newTab 을 따른다.
    const external = /^https?:\/\//.test(href) && !href.startsWith('https://nolcool.com');
    const openNew = newTab && external;
    return (
      <Link
        to={href}
        target={openNew ? '_blank' : undefined}
        rel={openNew ? 'noopener noreferrer' : undefined}
        className={`block cursor-pointer ${classes}`}
      >
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
