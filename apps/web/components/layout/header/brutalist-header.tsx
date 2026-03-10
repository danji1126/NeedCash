"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { DesignPicker } from "@/components/design/design-picker";
import { cn } from "@/lib/utils";

export function BrutalistHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-border bg-bg">
      {/* Top bar: logo + mobile controls */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <Link
          href="/"
          className="font-mono text-lg font-bold uppercase tracking-wider text-text"
        >
          {SITE.name}
          <span className="text-text-muted">{" ///"}</span>
        </Link>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <DesignPicker />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="border border-border px-2 py-1 font-mono text-xs uppercase tracking-wider text-text transition-[background-color,color] duration-[0.05s] hover:bg-accent hover:text-bg"
            aria-expanded={menuOpen}
            aria-controls="brutalist-mobile-menu"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {menuOpen ? "[✕]" : "[≡]"}
          </button>
        </div>
      </div>

      {/* Desktop nav */}
      <div className="hidden flex-wrap items-center gap-2 px-6 py-2 md:flex">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "border border-border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-[background-color,color] duration-[0.05s] hover:bg-accent hover:text-bg",
                isActive ? "bg-accent text-bg" : "text-text-secondary"
              )}
              {...(isActive ? { "aria-current": "page" as const } : {})}
            >
              [{link.label}]
            </Link>
          );
        })}
        <div className="ml-auto">
          <DesignPicker />
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="brutalist-mobile-menu"
        role="navigation"
        aria-label="모바일 메뉴"
        className={cn(
          "overflow-hidden transition-all duration-200 md:hidden",
          menuOpen ? "max-h-60" : "max-h-0"
        )}
      >
        <div className="flex flex-col border-t border-border px-6 py-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "border-b border-border py-2.5 font-mono text-xs uppercase tracking-wider transition-[background-color,color] duration-[0.05s] hover:bg-accent hover:px-2 hover:text-bg",
                  isActive ? "bg-accent text-bg px-2" : "text-text-secondary"
                )}
                {...(isActive ? { "aria-current": "page" as const } : {})}
              >
                [{link.label}]
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
