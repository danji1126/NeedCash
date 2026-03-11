import { NextRequest } from "next/server";
import { getVisitorId, setVisitorCookie } from "@/lib/visitor";
import {
  isRankableGame,
  validateScore,
  validateNickname,
  type RankableGame,
} from "@/lib/score-validation";
import { submitScore, checkRateLimit } from "@/lib/scores";
import { getKV, getDB } from "@/lib/env";

const MIN_PLAY_TIME: Record<RankableGame, number> = {
  reaction: 1000,
  typing: 5000,
  math: 3000,
  "color-sense": 2000,
  "color-memory": 3000,
};

export async function POST(request: NextRequest) {
  try {
    // SEC-13: Origin 검증 (CSRF 방어)
    const origin = request.headers.get("Origin");
    if (origin && !origin.endsWith("danji1126.workers.dev") && !origin.includes("localhost")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // SEC-05: IP 기반 rate limit (분당 30회)
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const kv = getKV();
    const rateKey = `score_rate:${ip}`;
    const rateCount = parseInt((await kv.get(rateKey)) || "0");
    if (rateCount > 30) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    await kv.put(rateKey, String(rateCount + 1), { expirationTtl: 60 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { gameSlug, score, nickname, metadata, sessionId } = body as {
      gameSlug?: string;
      score?: number;
      nickname?: string;
      metadata?: Record<string, unknown>;
      sessionId?: string;
    };

    if (!gameSlug || !isRankableGame(gameSlug)) {
      return Response.json({ error: "Invalid game" }, { status: 400 });
    }

    // SEC-09: Game Session 서버 검증
    if (!sessionId) {
      return Response.json({ error: "Session required" }, { status: 400 });
    }
    const db = getDB();
    const session = await db
      .prepare(
        `SELECT * FROM game_sessions WHERE id = ? AND game = ? AND used = 0`
      )
      .bind(sessionId, gameSlug)
      .first<{ started_at: number }>();
    if (!session) {
      return Response.json({ error: "Invalid session" }, { status: 400 });
    }
    const elapsed = Date.now() - session.started_at;
    if (elapsed < MIN_PLAY_TIME[gameSlug]) {
      return Response.json({ error: "Invalid session" }, { status: 400 });
    }
    await db
      .prepare(`UPDATE game_sessions SET used = 1 WHERE id = ?`)
      .bind(sessionId)
      .run();

    if (typeof score !== "number" || !validateScore(gameSlug, score)) {
      return Response.json({ error: "Invalid score" }, { status: 400 });
    }

    if (metadata) {
      const json = JSON.stringify(metadata);
      if (json.length > 1024) {
        return Response.json({ error: "Metadata too large (max 1KB)" }, { status: 400 });
      }
    }

    if (nickname !== undefined && nickname !== null) {
      const nicknameCheck = validateNickname(String(nickname));
      if (!nicknameCheck.valid) {
        return Response.json({ error: nicknameCheck.error }, { status: 400 });
      }
    }

    const { id: visitorId, isNew } = getVisitorId(request);

    const allowed = await checkRateLimit(visitorId, gameSlug);
    if (!allowed) {
      return Response.json(
        { error: "Too fast", retryAfter: 60 },
        { status: 429 }
      );
    }

    const result = await submitScore({
      visitorId,
      gameSlug,
      score,
      nickname: nickname?.trim() || null,
      metadata,
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    if (isNew) {
      setVisitorCookie(headers, visitorId);
    }

    return new Response(JSON.stringify(result), { status: 201, headers });
  } catch (error) {
    console.error("[POST /api/scores]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
