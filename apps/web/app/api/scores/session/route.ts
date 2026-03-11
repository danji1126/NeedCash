import { isRankableGame } from "@/lib/score-validation";
import { getDB } from "@/lib/env";

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { gameSlug } = body as { gameSlug?: string };
    if (!gameSlug || !isRankableGame(gameSlug)) {
      return Response.json({ error: "Invalid game" }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const db = getDB();
    await db
      .prepare(
        `INSERT INTO game_sessions (id, game, started_at) VALUES (?, ?, ?)`
      )
      .bind(sessionId, gameSlug, Date.now())
      .run();

    return Response.json({ sessionId });
  } catch (error) {
    console.error("[POST /api/scores/session]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
