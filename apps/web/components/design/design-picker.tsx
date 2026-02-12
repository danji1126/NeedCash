"use client";

import { useState, useRef, useEffect } from "react";
import { useDesign } from "@/lib/design/use-design";
import { DESIGNS, type DesignId } from "@/lib/design";
import { cn } from "@/lib/utils";

export function DesignPicker() {
  const { design, theme, setDesign, setTheme, availableThemes } = useDesign();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text"
        aria-label="디자인 변경"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-bg p-4 shadow-lg">
          {/* Design selection */}
          <p className="mb-2 text-[11px] uppercase tracking-[0.15em] text-text-muted">
            Design
          </p>
          <div className="mb-4 grid grid-cols-2 gap-1.5">
            {DESIGNS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDesign(d.id as DesignId)}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-xs transition-colors",
                  design === d.id
                    ? "bg-accent text-bg font-medium"
                    : "text-text-secondary hover:bg-bg-secondary"
                )}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Theme selection */}
          <p className="mb-2 text-[11px] uppercase tracking-[0.15em] text-text-muted">
            Theme
          </p>
          <div className="grid grid-cols-4 gap-2">
            {availableThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                }}
                className="group flex flex-col items-center gap-1"
                title={t.name}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform group-hover:scale-110",
                    theme === t.id
                      ? "border-accent scale-110"
                      : "border-border"
                  )}
                  style={{ background: t.preview }}
                />
                <span className="text-[10px] text-text-muted">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
