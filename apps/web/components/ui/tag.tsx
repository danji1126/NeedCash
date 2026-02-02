"use client";

import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function Tag({ label, active = false, onClick }: TagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 text-[13px] tracking-wide transition-opacity",
        active
          ? "border-b border-text font-medium text-text"
          : "text-text-muted hover:opacity-60"
      )}
    >
      {label}
    </button>
  );
}
