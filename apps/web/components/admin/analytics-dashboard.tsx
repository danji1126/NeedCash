"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/admin/auth-provider";
import { AnalyticsToggle } from "@/components/admin/analytics-toggle";
import { StatCard } from "@/components/admin/stat-card";
import { ChartBar } from "@/components/admin/chart-bar";

interface GameStat {
  game: string;
  plays: number;
  avgScore: number;
  uniquePlayers: number;
}

interface ScoreRow {
  id: number;
  visitor_id: string;
  nickname: string | null;
  score: number;
  score_type: string;
  metadata: string | null;
  created_at: string;
}

const GAME_LABELS: Record<string, string> = {
  reaction: "Reaction Test",
  "color-sense": "Color Sense",
  "color-memory": "Color Memory",
  typing: "Typing Speed",
  math: "Math Game",
};

const GAMES = Object.keys(GAME_LABELS);

export function AnalyticsDashboard() {
  const { apiKey, isAuthenticated } = useAuth();
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    Promise.all(
      GAMES.map((game) =>
        fetch(`/api/scores/${game}?limit=1`)
          .then((r) => r.json() as Promise<{ total?: number }>)
          .then((data) => ({
            game,
            plays: data.total ?? 0,
            avgScore: 0,
            uniquePlayers: data.total ?? 0,
          }))
          .catch(() => ({ game, plays: 0, avgScore: 0, uniquePlayers: 0 }))
      )
    ).then((stats) => {
      setGameStats(stats);
      setLoading(false);
    });
  }, [apiKey]);

  const loadScores = useCallback(
    (game: string) => {
      setSelectedGame(game);
      setScoresLoading(true);
      fetch(`/api/admin/scores/${game}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
        .then((r) => r.json() as Promise<{ scores?: ScoreRow[] }>)
        .then((data) => {
          setScores(data.scores ?? []);
          setScoresLoading(false);
        })
        .catch(() => setScoresLoading(false));
    },
    [apiKey]
  );

  const deleteScore = useCallback(
    async (game: string, id: number) => {
      if (!confirm("이 점수를 삭제하시겠습니까?")) return;
      await fetch(`/api/admin/scores/${game}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ id }),
      });
      loadScores(game);
    },
    [apiKey, loadScores]
  );

  if (!isAuthenticated) {
    return (
      <p className="text-center text-text-muted">
        관리자 인증이 필요합니다.
      </p>
    );
  }

  const totalPlays = gameStats.reduce((s, g) => s + g.plays, 0);

  return (
    <div className="space-y-8">
      <AnalyticsToggle apiKey={apiKey!} />

      <section>
        <h2 className="text-lg font-bold font-heading">게임 통계</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="총 플레이" value={totalPlays} />
          <StatCard label="게임 수" value={gameStats.length} />
          <StatCard
            label="가장 인기"
            value={
              gameStats.length > 0
                ? [...gameStats].sort((a, b) => b.plays - a.plays)[0].game
                : "-"
            }
          />
          <StatCard
            label="총 플레이어"
            value={gameStats.reduce((s, g) => s + g.uniquePlayers, 0)}
          />
        </div>
      </section>

      {!loading && gameStats.length > 0 && (
        <section>
          <h2 className="text-lg font-bold font-heading">게임별 플레이 수</h2>
          <div className="mt-4">
            <ChartBar
              data={gameStats.map((g) => ({ label: g.game, value: g.plays }))}
              unit="회"
            />
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold font-heading">리더보드 관리</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {GAMES.map((game) => (
            <button
              key={game}
              onClick={() => loadScores(game)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                selectedGame === game
                  ? "border-text/40 bg-surface-hover font-semibold text-foreground"
                  : "border-border/60 text-text-muted hover:bg-surface-hover/50"
              }`}
            >
              {GAME_LABELS[game]}
            </button>
          ))}
        </div>

        {scoresLoading && (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-surface-hover/50"
              />
            ))}
          </div>
        )}

        {selectedGame && !scoresLoading && scores.length === 0 && (
          <p className="mt-4 text-sm text-text-muted">
            등록된 점수가 없습니다.
          </p>
        )}

        {selectedGame && !scoresLoading && scores.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-text-muted">
                  <th className="px-2 py-2">순위</th>
                  <th className="px-2 py-2">닉네임</th>
                  <th className="px-2 py-2">점수</th>
                  <th className="px-2 py-2">일시</th>
                  <th className="px-2 py-2">관리</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/30 hover:bg-surface-hover/30"
                  >
                    <td className="px-2 py-2 text-text-muted">#{i + 1}</td>
                    <td className="px-2 py-2">
                      {s.nickname || (
                        <span className="text-text-muted">익명</span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-bold tabular-nums">
                      {s.score}
                    </td>
                    <td className="px-2 py-2 text-text-muted">
                      {s.created_at.replace("T", " ").slice(0, 16)}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => deleteScore(selectedGame, s.id)}
                        className="text-red-400 transition-colors hover:text-red-300"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-text-muted">
              총 {scores.length}건 (최근 100건)
            </p>
          </div>
        )}
      </section>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded bg-surface-hover/50"
            />
          ))}
        </div>
      )}
    </div>
  );
}
