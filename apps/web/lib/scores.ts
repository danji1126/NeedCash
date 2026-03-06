import type { RankableGame } from "./score-validation";
import { SCORE_ORDER, getScoreType } from "./score-validation";

export interface ScoreEntry {
  id: number;
  nickname: string | null;
  score: number;
  metadata: string | null;
  createdAt: string;
}

export interface LeaderboardResult {
  leaderboard: (ScoreEntry & { rank: number })[];
  myRank: { rank: number; score: number; nickname: string | null } | null;
  total: number;
}

export async function submitScore(data: {
  visitorId: string;
  gameSlug: RankableGame;
  score: number;
  nickname: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ id: number }> {
  const db = getDB();
  const scoreType = getScoreType(data.gameSlug);

  await db.batch([
    db
      .prepare(`INSERT OR IGNORE INTO visitors (id) VALUES (?)`)
      .bind(data.visitorId),
    db
      .prepare(
        `UPDATE visitors SET last_seen = datetime('now'), visit_count = visit_count + 1 WHERE id = ?`
      )
      .bind(data.visitorId),
  ]);

  const row = await db
    .prepare(
      `INSERT INTO game_scores (visitor_id, game_slug, score, score_type, nickname, metadata)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
    .bind(
      data.visitorId,
      data.gameSlug,
      data.score,
      scoreType,
      data.nickname || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    )
    .first<{ id: number }>();

  return { id: row!.id };
}

export async function getLeaderboard(
  gameSlug: RankableGame,
  visitorId: string | null,
  limit: number = 10
): Promise<LeaderboardResult> {
  const db = getDB();
  const order = SCORE_ORDER[gameSlug];

  const { results } = await db
    .prepare(
      `SELECT id, nickname, score, metadata, created_at as createdAt
       FROM game_scores
       WHERE game_slug = ?
       ORDER BY score ${order}
       LIMIT ?`
    )
    .bind(gameSlug, limit)
    .all<ScoreEntry>();

  const leaderboard = results.map((entry, i) => ({
    ...entry,
    rank: i + 1,
  }));

  const countRow = await db
    .prepare(
      `SELECT COUNT(DISTINCT visitor_id) as total FROM game_scores WHERE game_slug = ?`
    )
    .bind(gameSlug)
    .first<{ total: number }>();

  let myRank = null;
  if (visitorId) {
    const myBest = await db
      .prepare(
        `SELECT score, nickname FROM game_scores
         WHERE visitor_id = ? AND game_slug = ?
         ORDER BY score ${order} LIMIT 1`
      )
      .bind(visitorId, gameSlug)
      .first<{ score: number; nickname: string | null }>();

    if (myBest) {
      const op = order === "ASC" ? "<" : ">";
      const rankRow = await db
        .prepare(
          `SELECT COUNT(*) + 1 as rank FROM game_scores
           WHERE game_slug = ? AND score ${op} ?`
        )
        .bind(gameSlug, myBest.score)
        .first<{ rank: number }>();

      myRank = {
        rank: rankRow!.rank,
        score: myBest.score,
        nickname: myBest.nickname,
      };
    }
  }

  return { leaderboard, myRank, total: countRow!.total };
}

export async function checkRateLimit(
  visitorId: string,
  gameSlug: string,
  intervalMs: number = 60_000
): Promise<boolean> {
  const db = getDB();
  const last = await db
    .prepare(
      `SELECT created_at FROM game_scores
       WHERE visitor_id = ? AND game_slug = ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(visitorId, gameSlug)
    .first<{ created_at: string }>();

  if (!last) return true;
  const elapsed = Date.now() - new Date(last.created_at + "Z").getTime();
  return elapsed >= intervalMs;
}

function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}
