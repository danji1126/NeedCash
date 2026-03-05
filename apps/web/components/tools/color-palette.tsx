"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type PaletteType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "monochromatic";

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function generatePalette(base: HSL, type: PaletteType): HSL[] {
  const { h, s, l } = base;
  switch (type) {
    case "complementary":
      return [{ h, s, l }, { h: wrapHue(h + 180), s, l }];
    case "analogous":
      return [
        { h: wrapHue(h - 30), s, l },
        { h, s, l },
        { h: wrapHue(h + 30), s, l },
      ];
    case "triadic":
      return [
        { h, s, l },
        { h: wrapHue(h + 120), s, l },
        { h: wrapHue(h + 240), s, l },
      ];
    case "split-complementary":
      return [
        { h, s, l },
        { h: wrapHue(h + 150), s, l },
        { h: wrapHue(h + 210), s, l },
      ];
    case "monochromatic":
      return [
        { h, s, l: Math.max(l - 30, 5) },
        { h, s, l: Math.max(l - 15, 10) },
        { h, s, l },
        { h, s, l: Math.min(l + 15, 90) },
        { h, s, l: Math.min(l + 30, 95) },
      ];
  }
}

const paletteTypes: { value: PaletteType; label: string }[] = [
  { value: "complementary", label: "Complementary" },
  { value: "analogous", label: "Analogous" },
  { value: "triadic", label: "Triadic" },
  { value: "split-complementary", label: "Split-complementary" },
  { value: "monochromatic", label: "Monochromatic" },
];

export function ColorPalette() {
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(50);
  const [paletteType, setPaletteType] = useState<PaletteType>("complementary");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const base: HSL = { h: hue, s: saturation, l: lightness };
  const colors = generatePalette(base, paletteType);

  async function copyHex(hex: string, index: number) {
    await navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-text-primary">
        Color Palette Generator
      </h2>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 shrink-0 rounded border border-border/60"
            style={{
              backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            }}
          />
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Hue</span>
                <span>{hue}</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="w-full accent-text-primary"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Saturation</span>
                <span>{saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-text-primary"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Lightness</span>
                <span>{lightness}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={lightness}
                onChange={(e) => setLightness(Number(e.target.value))}
                className="w-full accent-text-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {paletteTypes.map((pt) => (
            <Button
              key={pt.value}
              size="sm"
              variant={paletteType === pt.value ? "default" : "outline"}
              onClick={() => setPaletteType(pt.value)}
            >
              {pt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {colors.map((color, i) => {
          const hex = hslToHex(color.h, color.s, color.l);
          const [r, g, b] = hslToRgb(color.h, color.s, color.l);
          return (
            <button
              key={i}
              onClick={() => copyHex(hex, i)}
              className="group space-y-2 rounded border border-border/60 p-3 text-left transition-colors hover:bg-surface-hover"
            >
              <div
                className="h-20 w-full rounded"
                style={{
                  backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)`,
                }}
              />
              <div className="space-y-0.5">
                <p className="font-mono text-xs font-bold text-text-primary">
                  {copiedIndex === i ? "Copied!" : hex}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  hsl({Math.round(color.h)}, {Math.round(color.s)}%,{" "}
                  {Math.round(color.l)}%)
                </p>
                <p className="font-mono text-xs text-text-muted">
                  rgb({r}, {g}, {b})
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
