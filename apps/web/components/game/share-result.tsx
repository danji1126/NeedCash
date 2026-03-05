"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildShareText, copyToClipboard } from "@/lib/share";

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

interface ShareResultProps {
  game: string;
  title: string;
  lines: string[];
}

export function ShareResult({ game, title, lines }: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const text = buildShareText({ game, title, lines });
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [game, title, lines]);

  return (
    <motion.button
      onClick={handleShare}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4, ease: EASING }}
      className="mt-4 flex items-center gap-2 rounded border border-border/60 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      <AnimatePresence mode="wait">
        <motion.span
          key={copied ? "copied" : "share"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {copied ? "복사됨!" : "결과 공유"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
