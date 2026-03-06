"use client";

import { isRankableGame } from "@/lib/score-validation";
import type { RankableGame } from "@/lib/score-validation";
import { Leaderboard } from "@/components/game/leaderboard";

interface GameLeaderboardSectionProps {
  game: string;
}

export function GameLeaderboardSection({ game }: GameLeaderboardSectionProps) {
  if (!isRankableGame(game)) return null;

  return (
    <div className="mt-12 flex flex-col items-center">
      <div className="mx-auto h-px w-full max-w-xs bg-border/60" />
      <Leaderboard game={game as RankableGame} />
    </div>
  );
}
