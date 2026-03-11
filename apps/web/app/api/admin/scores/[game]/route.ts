import { NextRequest } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { isRankableGame } from "@/lib/score-validation";
import { getDB } from "@/lib/env";
import { checkAdminRateLimit } from "@/lib/admin-rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();

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
  } catch (error) {
    console.error("[GET /api/admin/scores/[game]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();

    const { game } = await params;
    if (!isRankableGame(game)) {
      return Response.json({ error: "Invalid game" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid score id" }, { status: 400 });
    }

    const db = getDB();
    await db
      .prepare(`DELETE FROM game_scores WHERE id = ? AND game_slug = ?`)
      .bind(id, game)
      .run();

    return Response.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/admin/scores/[game]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
