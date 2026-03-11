"use client";

import { useState } from "react";
import type { RankableGame } from "@/lib/score-validation";
import { isRankableGame } from "@/lib/score-validation";
import { ScoreSubmit } from "@/components/game/score-submit";
import { Leaderboard } from "@/components/game/leaderboard";
import { GameHistoryPanel } from "@/components/game/game-history-panel";
import { ShareResult } from "@/components/game/share-result";

interface GameResultPanelProps {
  game: string;
  score: number;
  grade: string;
  title: string;
  shareLines: string[];
  sessionId?: string | null;
  children?: React.ReactNode;
}

export function GameResultPanel({
  game,
  score,
  grade,
  title,
  shareLines,
  sessionId,
  children,
}: GameResultPanelProps) {
  const [submitted, setSubmitted] = useState(false);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const rankable = isRankableGame(game);

  return (
    <>
      {children}

      {rankable && !submitted && (
        <ScoreSubmit
          game={game as RankableGame}
          score={score}
          metadata={{ grade }}
          sessionId={sessionId}
          onSubmitted={() => {
            setSubmitted(true);
            setLeaderboardKey((k) => k + 1);
          }}
          onSkipped={() => setSubmitted(true)}
        />
      )}

      <ShareResult game={game} title={title} lines={shareLines} />

      {rankable && (
        <Leaderboard
          game={game as RankableGame}
          key={`lb-${leaderboardKey}`}
        />
      )}

      <GameHistoryPanel game={game} />
    </>
  );
}
