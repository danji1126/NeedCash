"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GAMES } from "@/lib/constants";
import { getDailyGame, getStreak, updateStreak } from "@/lib/daily";
import { UIIcon } from "@/components/ui/icons";

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

export function DailyChallenge() {
  const [dailySlug, setDailySlug] = useState<string | null>(null);
  const [streak, setStreak] = useState({ current: 0, best: 0, lastVisit: "" });

  useEffect(() => {
    const slug = getDailyGame(GAMES);
    setDailySlug(slug);
    const streakData = updateStreak();
    setStreak(streakData);
  }, []);

  const game = GAMES.find((g) => g.slug === dailySlug);

  if (!game) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASING }}
      className="rounded-2xl border border-border/60 bg-bg-secondary p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">📅</span>
        <h3 className="font-heading text-lg font-semibold text-text-secondary">
          오늘의 게임
        </h3>
      </div>

      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 text-text-muted">
          <UIIcon icon={game.icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="font-heading font-semibold text-text-secondary">
            {game.title}
          </p>
          <p className="mt-1 text-sm text-text-muted">{game.description}</p>
        </div>
      </div>

      <Link
        href={`/game/${game.slug}`}
        className="inline-flex items-center gap-1 rounded-lg bg-text-secondary px-4 py-2 text-sm font-medium text-bg-secondary transition-opacity hover:opacity-80"
      >
        도전하기 →
      </Link>

      {streak.current > 0 && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="text-sm text-text-muted">
            🔥 연속 방문 {streak.current}일
            {streak.best > streak.current && (
              <span className="ml-2 text-xs text-text-muted/60">
                (최고 {streak.best}일)
              </span>
            )}
          </p>
          {streak.current >= 3 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, ease: EASING }}
              className="mt-1 text-xs text-text-muted"
            >
              꾸준히 방문하고 계시네요! 대단해요 👏
            </motion.p>
          )}
        </div>
      )}
    </motion.div>
  );
}
