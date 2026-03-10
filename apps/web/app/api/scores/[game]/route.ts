import { NextRequest } from "next/server";
import { isRankableGame } from "@/lib/score-validation";
import { getLeaderboard } from "@/lib/scores";
import { getVisitorId } from "@/lib/visitor";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params;

    if (!isRankableGame(game)) {
      return Response.json({ error: "Invalid game" }, { status: 400 });
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "10"), 1), 50);

    const { id: visitorId } = getVisitorId(request);
    const result = await getLeaderboard(game, visitorId || null, limit);

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[GET /api/scores/[game]]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
