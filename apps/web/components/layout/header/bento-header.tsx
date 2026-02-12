"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { DesignPicker } from "@/components/design/design-picker";
import { cn } from "@/lib/utils";

export function BentoHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[80rem] items-center justify-between px-8">
        <Link
          href="/"
          className="font-heading text-base font-semibold tracking-[-0.02em] text-text"
        >
          {SITE.name}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text"
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
          "overflow-hidden transition-all duration-300 md:hidden",
          menuOpen ? "max-h-60" : "max-h-0"
        )}
      >
        <div className="flex flex-col gap-1 px-8 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:px-3"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
