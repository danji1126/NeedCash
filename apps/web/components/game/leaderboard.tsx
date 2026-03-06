"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { RankableGame } from "@/lib/score-validation";
import { SCORE_UNIT } from "@/lib/score-validation";

interface LeaderboardEntry {
  id: number;
  rank: number;
  nickname: string | null;
  score: number;
  metadata: string | null;
  createdAt: string;
}

interface MyRank {
  rank: number;
  score: number;
  nickname: string | null;
}

interface LeaderboardProps {
  game: RankableGame;
}

const EASING: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function Leaderboard({ game }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/scores/${game}?limit=10`)
      .then((res) => res.json() as Promise<{ leaderboard?: LeaderboardEntry[]; myRank?: MyRank; total?: number }>)
      .then((data) => {
        setEntries(data.leaderboard ?? []);
        setMyRank(data.myRank ?? null);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [game]);

  const unit = SCORE_UNIT[game];

  return (
    <section className="mt-8 w-full max-w-xs">
      <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
        Leaderboard
      </p>

      {loading && (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded bg-surface-hover/50"
            />
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="mt-3 text-center text-sm text-text-muted">
          아직 기록이 없습니다. 첫 번째 도전자가 되어보세요!
        </p>
      )}

      {!loading && entries.length > 0 && (
        <div className="mt-3" role="table" aria-label="리더보드">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              role="row"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: EASING }}
              className="flex items-center justify-between border-b border-border/60 py-2 text-sm"
            >
              <span className="w-8 text-center">
                {MEDALS[entry.rank] ?? `#${entry.rank}`}
              </span>
              <span className="flex-1 truncate px-2 text-text-secondary">
                {entry.nickname || "익명"}
              </span>
              <span className="font-bold tabular-nums">
                {entry.score}
                <span className="ml-0.5 text-xs text-text-muted">{unit}</span>
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {myRank && (
        <div className="mt-3 rounded-md border border-border/60 bg-surface-hover/30 px-3 py-2 text-center text-sm">
          <span className="text-text-muted">내 순위</span>{" "}
          <span className="font-bold">#{myRank.rank}</span>
          <span className="text-text-muted"> / {total.toLocaleString()}명</span>
          <span className="ml-2 text-text-muted">·</span>
          <span className="ml-2 font-bold tabular-nums">
            {myRank.score}
            {unit}
          </span>
        </div>
      )}
    </section>
  );
}
