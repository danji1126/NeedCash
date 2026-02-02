import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/mdx";

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24">
      <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
        Contents
      </p>
      <ul className="mt-4 space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block text-[13px] leading-relaxed text-text-muted transition-opacity hover:opacity-50",
                heading.level === 3 && "pl-3"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
