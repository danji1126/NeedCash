"use client";

import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { DesignPicker } from "@/components/design/design-picker";

export function BrutalistHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-border bg-bg">
      {/* Top bar: logo */}
      <div className="border-b border-border px-6 py-3">
        <Link
          href="/"
          className="font-mono text-lg font-bold uppercase tracking-wider text-text"
        >
          {SITE.name}
          <span className="text-text-muted">{" ///"}</span>
        </Link>
      </div>

      {/* Nav buttons */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-2">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-border px-3 py-1 font-mono text-xs uppercase tracking-wider text-text-secondary transition-[background-color,color] duration-[0.05s] hover:bg-accent hover:text-bg"
          >
            [{link.label}]
          </Link>
        ))}
        <div className="ml-auto">
          <DesignPicker />
        </div>
      </div>
    </header>
  );
}
