"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  id: number;
  numbers: number[];
  bonus: number;
}

function getBallColor(num: number): string {
  if (num <= 10) return "#fbc400";
  if (num <= 20) return "#69c8f2";
  if (num <= 30) return "#ff7272";
  if (num <= 40) return "#aaaaaa";
  return "#b0d840";
}

function LottoBall({
  number,
  delay,
}: {
  number: number;
  delay: number;
  isBonus?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1],
      }}
      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: getBallColor(number) }}
    >
      {String(number).padStart(2, "0")}
    </motion.div>
  );
}

function generateLotto(): { numbers: number[]; bonus: number } {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const numbers = pool.slice(0, 6).sort((a, b) => a - b);
  const bonus = pool[6];

  return { numbers, bonus };
}

export function LottoGame() {
  const [result, setResult] = useState<{
    numbers: number[];
    bonus: number;
  } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [animKey, setAnimKey] = useState(0);

  const draw = () => {
    if (drawing) return;
    setDrawing(true);
    setAnimKey((k) => k + 1);

    const lotto = generateLotto();
    setResult(lotto);

    setTimeout(() => {
      setDrawing(false);
      setHistory((prev) => [
        {
          id: prev.length + 1,
          numbers: lotto.numbers,
          bonus: lotto.bonus,
        },
        ...prev.slice(0, 9),
      ]);
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="min-h-[80px]">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={animKey}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {result.numbers.map((num, i) => (
                <LottoBall key={`${animKey}-${num}`} number={num} delay={i * 0.3} />
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="mx-1 text-lg text-text-muted"
              >
                +
              </motion.span>
              <LottoBall
                key={`${animKey}-bonus`}
                number={result.bonus}
                delay={2.0}
                isBonus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button onClick={draw} disabled={drawing} size="lg" className="mt-8">
        Draw Numbers
      </Button>

      {history.length > 0 && (
        <div className="mt-12 w-full max-w-md">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            Previous Results
          </p>
          <div className="mt-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 border-b border-border/60 py-3 text-sm"
              >
                <span className="w-6 text-text-muted">#{item.id}</span>
                <div className="flex gap-1">
                  {item.numbers.map((n) => (
                    <span
                      key={n}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getBallColor(n) }}
                    >
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                <span className="text-text-muted">+</span>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: getBallColor(item.bonus) }}
                >
                  {String(item.bonus).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
