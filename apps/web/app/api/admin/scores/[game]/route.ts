import { NextRequest } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { isRankableGame } from "@/lib/score-validation";

function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("@/lib/local-db");
    return getLocalDB() as unknown as D1Database;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const { game } = await params;
  if (!isRankableGame(game)) {
    return Response.json({ error: "Invalid game" }, { status: 400 });
  }

  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT id, visitor_id, nickname, score, score_type, metadata, created_at
       FROM game_scores
       WHERE game_slug = ?
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .bind(game)
    .all<{
      id: number;
      visitor_id: string;
      nickname: string | null;
      score: number;
      score_type: string;
      metadata: string | null;
      created_at: string;
    }>();

  return Response.json({ scores: results });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const { game } = await params;
  const body = (await request.json()) as { id?: number };

  if (!body.id) {
    return Response.json({ error: "Missing score id" }, { status: 400 });
  }

  const db = getDB();
  await db
    .prepare(`DELETE FROM game_scores WHERE id = ? AND game_slug = ?`)
    .bind(body.id, game)
    .run();

  return Response.json({ deleted: true });
}
