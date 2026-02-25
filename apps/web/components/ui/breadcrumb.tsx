import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-text-muted">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className="mx-1">/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-opacity hover:opacity-50"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-text-secondary">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
