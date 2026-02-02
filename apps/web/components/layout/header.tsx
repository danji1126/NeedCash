"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
        <Link
          href="/"
          className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-text transition-opacity hover:opacity-50"
        >
          {SITE.name}
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] tracking-wide text-text-secondary transition-opacity hover:opacity-50"
            >
              {link.label}
            </Link>
          ))}
          <ThemeSwitcher />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeSwitcher />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center text-text-secondary transition-opacity hover:opacity-50"
            aria-label="Menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
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

      {/* Subtle divider */}
      <div className="mx-8 h-px bg-border/40" />

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] md:hidden",
          menuOpen ? "max-h-60" : "max-h-0"
        )}
      >
        <div className="flex flex-col gap-1 px-8 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 text-[13px] tracking-wide text-text-secondary transition-opacity hover:opacity-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
