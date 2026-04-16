import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="py-2" style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm leading-[1.25] text-neon-text-muted">
        <li className="flex items-center leading-[1.25]">
          <Link target="_blank" rel="noopener noreferrer"
            to="/"
            className="inline-flex items-center leading-[1.25] transition-colors hover:text-neon-primary-light"
          >
            홈
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1 leading-[1.25]">
            <span aria-hidden="true" className="inline-flex items-center leading-[1.25] text-neon-text-subtle">/</span>
            {item.href ? (
              <Link target="_blank" rel="noopener noreferrer"
                to={item.href}
                className="inline-flex items-center leading-[1.25] transition-colors hover:text-neon-primary-light"
              >
                {item.label}
              </Link>
            ) : (
              <span className="inline-flex items-center leading-[1.25] text-neon-text">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
