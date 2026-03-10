import { NextRequest } from "next/server";
import { getVisitorId, setVisitorCookie } from "@/lib/visitor";
import {
  isRankableGame,
  validateScore,
  validateNickname,
} from "@/lib/score-validation";
import { submitScore, checkRateLimit } from "@/lib/scores";

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { gameSlug, score, nickname, metadata } = body as {
      gameSlug?: string;
      score?: number;
      nickname?: string;
      metadata?: Record<string, unknown>;
    };

    if (!gameSlug || !isRankableGame(gameSlug)) {
      return Response.json({ error: "Invalid game" }, { status: 400 });
    }

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
