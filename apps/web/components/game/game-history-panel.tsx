"use client";

import { useState, useEffect } from "react";
import {
  getGameHistory,
  clearGameHistory,
  type GameHistoryEntry,
} from "@/lib/game-history";
import { SCORE_UNIT, type RankableGame } from "@/lib/score-validation";

interface GameHistoryPanelProps {
  game: string;
  refreshKey?: number;
}

function groupByDate(entries: GameHistoryEntry[]) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.getTime() - 86400000)
    .toISOString()
    .split("T")[0];

  const groups: { label: string; items: GameHistoryEntry[] }[] = [];
  const map = new Map<string, GameHistoryEntry[]>();

  for (const entry of entries) {
    const date = entry.playedAt.split("T")[0];
    let label: string;
    if (date === today) label = "오늘";
    else if (date === yesterday) label = "어제";
    else label = date;

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }

  for (const [label, items] of map) {
    groups.push({ label, items });
  }
  return groups;
}

export function GameHistoryPanel({ game, refreshKey }: GameHistoryPanelProps) {
  const [entries, setEntries] = useState<GameHistoryEntry[]>(() =>
    getGameHistory(game)
  );

  useEffect(() => {
    setEntries(getGameHistory(game));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (entries.length === 0) return null;

  const scores = entries.map((e) => e.score);
  const unit =
    game in SCORE_UNIT ? SCORE_UNIT[game as RankableGame] : "";
  const stats = {
    total: entries.length,
    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    best:
      game === "reaction" ? Math.min(...scores) : Math.max(...scores),
  };

  const groups = groupByDate(entries.slice(0, 20));

  const handleClear = () => {
    clearGameHistory(game);
    setEntries([]);
  };

  return (
    <section className="mt-8 w-full max-w-xs">
      <div className="flex items-center justify-between">
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          My History
        </p>
        <button
          onClick={handleClear}
          className="text-xs text-text-muted transition-colors hover:text-red-400"
        >
          삭제
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md border border-border/60 px-2 py-1.5">
          <p className="text-xs text-text-muted">총</p>
          <p className="font-bold">{stats.total}회</p>
        </div>
        <div className="rounded-md border border-border/60 px-2 py-1.5">
          <p className="text-xs text-text-muted">평균</p>
          <p className="font-bold">
            {stats.average}
            {unit}
          </p>
        </div>
        <div className="rounded-md border border-border/60 px-2 py-1.5">
          <p className="text-xs text-text-muted">최고</p>
          <p className="font-bold">
            {stats.best}
            {unit}
          </p>
        </div>
      </div>

      {groups.map(({ label, items }) => (
        <div key={label} className="mt-3">
          <p className="text-xs text-text-muted">{label}</p>
          <div className="mt-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm"
              >
                <span className="font-bold">{item.grade}</span>
                <span className="flex-1 truncate px-2 text-text-secondary">
                  {item.title}
                </span>
                <span className="tabular-nums">
                  {item.score}
                  <span className="ml-0.5 text-xs text-text-muted">{unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
