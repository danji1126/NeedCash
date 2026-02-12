"use client";

import { useDesign } from "@/lib/design/use-design";

export function GlassBackground() {
  const { design } = useDesign();

  if (design !== "glass") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute h-[500px] w-[500px] rounded-full opacity-40 blur-[80px]"
        style={{
          background: "var(--gradient-1, #4C1D95)",
          top: "10%",
          left: "15%",
          animation: "glass-float 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute h-[400px] w-[400px] rounded-full opacity-30 blur-[80px]"
        style={{
          background: "var(--gradient-2, #065F46)",
          top: "50%",
          right: "10%",
          animation: "glass-float 20s ease-in-out infinite 6.6s",
        }}
      />
      <div
        className="absolute h-[350px] w-[350px] rounded-full opacity-35 blur-[80px]"
        style={{
          background: "var(--gradient-3, #1E1B4B)",
          bottom: "10%",
          left: "40%",
          animation: "glass-float 20s ease-in-out infinite 13.3s",
        }}
      />
    </div>
  );
}
