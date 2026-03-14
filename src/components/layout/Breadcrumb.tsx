import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="py-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-neon-text-muted">
        <li>
          <Link
            href="/"
            className="transition-colors hover:text-neon-primary-light"
          >
            홈
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <span className="text-neon-text-muted/40">/</span>
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-neon-primary-light"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-neon-text">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
