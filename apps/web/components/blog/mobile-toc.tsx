"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/mdx";

interface MobileTocProps {
  headings: Heading[];
}

export function MobileToc({ headings }: MobileTocProps) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) return null;

  return (
    <div className="mt-8 border-b border-border/60 lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-[13px] uppercase tracking-[0.2em] text-text-muted transition-opacity hover:opacity-50"
      >
        <span>Contents</span>
        <span
          className={cn(
            "transition-transform duration-300",
            open && "rotate-180"
          )}
        >
          &#x25BE;
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)]",
          open ? "max-h-96 pb-4" : "max-h-0"
        )}
      >
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={() => setOpen(false)}
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
      </div>
    </div>
  );
}
