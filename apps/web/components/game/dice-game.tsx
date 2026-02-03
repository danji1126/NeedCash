"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  id: number;
  dice: [number, number];
  sum: number;
  isDouble: boolean;
}

const DOT_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const GRID_INDICES = Array.from({ length: 9 }, (_, i) => i);

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <motion.div
      className="grid h-24 w-24 grid-cols-3 grid-rows-3 gap-1 border border-border/60 p-3 sm:h-28 sm:w-28"
      animate={
        rolling
          ? { rotateX: [0, 360, 720], rotateY: [0, 180, 360] }
          : { rotateX: 0, rotateY: 0 }
      }
      transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
    >
      {GRID_INDICES.map((i) => (
        <div key={i} className="flex items-center justify-center">
          {DOT_POSITIONS[value]?.includes(i) && (
            <div className="h-3.5 w-3.5 rounded-full bg-text sm:h-4 sm:w-4" />
          )}
        </div>
      ))}
    </motion.div>
  );
}

export function DiceGame() {
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const newDice: [number, number] = [d1, d2];
      setDice(newDice);
      setRolling(false);

      setHistory((prev) => [
        {
          id: prev.length + 1,
          dice: newDice,
          sum: d1 + d2,
          isDouble: d1 === d2,
        },
        ...prev.slice(0, 9),
      ]);
    }, 600);
  };

  const sum = dice[0] + dice[1];

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-6">
        <DiceFace value={dice[0]} rolling={rolling} />
        <DiceFace value={dice[1]} rolling={rolling} />
      </div>

      <AnimatePresence mode="wait">
        {!rolling && (
          <motion.p
            key={sum}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.215, 0.61, 0.355, 1] }}
            className="mt-8 text-2xl font-bold tracking-[-0.02em]"
          >
            {sum}
            {dice[0] === dice[1] && (
              <span className="ml-2 text-text-muted">Double</span>
            )}
          </motion.p>
        )}
      </AnimatePresence>

      <Button onClick={roll} disabled={rolling} size="lg" className="mt-8">
        Roll Dice
      </Button>

      {history.length > 0 && (
        <div className="mt-12 w-full max-w-xs">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            History
          </p>
          <div className="mt-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-border/60 py-2.5 text-sm"
              >
                <span className="text-text-muted">#{item.id}</span>
                <span>
                  {item.dice[0]} + {item.dice[1]} = {item.sum}
                </span>
                {item.isDouble ? (
                  <span className="text-[13px] text-text-muted">Double</span>
                ) : (
                  <span className="w-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
