"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { DesignPicker } from "@/components/design/design-picker";
import { cn } from "@/lib/utils";

export function GlassHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-between rounded-full border border-card-border bg-card-bg px-6 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold text-text">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
          {SITE.name}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
          <DesignPicker />
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <DesignPicker />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center text-text-secondary"
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "mx-auto mt-2 max-w-5xl overflow-hidden rounded-2xl transition-all duration-500 md:hidden",
          menuOpen
            ? "max-h-60 border border-card-border bg-card-bg backdrop-blur-xl"
            : "max-h-0"
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg py-2.5 px-3 text-sm text-text-secondary hover:bg-bg-secondary/50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
