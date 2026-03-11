import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/score-validation", () => ({
  isRankableGame: vi.fn(),
}));

vi.mock("@/lib/scores", () => ({
  getLeaderboard: vi.fn(),
}));

vi.mock("@/lib/visitor", () => ({
  getVisitorId: vi.fn(),
}));

import { GET } from "../scores/[game]/route";
import { isRankableGame } from "@/lib/score-validation";
import { getLeaderboard } from "@/lib/scores";
import { getVisitorId } from "@/lib/visitor";
import { NextRequest } from "next/server";

const mockIsRankableGame = vi.mocked(isRankableGame);
const mockGetLeaderboard = vi.mocked(getLeaderboard);
const mockGetVisitorId = vi.mocked(getVisitorId);

function createRequest(game: string, queryParams?: Record<string, string>): {
  request: NextRequest;
  context: { params: Promise<{ game: string }> };
} {
  const url = new URL(`http://localhost/api/scores/${game}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }
  }
  return {
    request: new NextRequest(url),
    context: { params: Promise.resolve({ game }) },
  };
}

const mockLeaderboardResult = {
  leaderboard: [
    { id: 1, nickname: "player1", score: 100, metadata: null, createdAt: "2025-01-01", rank: 1 },
  ],
  myRank: null,
  total: 1,
};

beforeEach(() => {
  vi.resetAllMocks();
  mockIsRankableGame.mockReturnValue(true);
  mockGetVisitorId.mockReturnValue({ id: "visitor-123", isNew: false });
  mockGetLeaderboard.mockResolvedValue(mockLeaderboardResult);
});

describe("GET /api/scores/[game]", () => {
  // API-SG-001: 정상 조회 → 200, LeaderboardResult
  it("정상 조회 → 200, LeaderboardResult", async () => {
    const { request, context } = createRequest("reaction");

    const res = await GET(request, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockLeaderboardResult);
    expect(mockGetLeaderboard).toHaveBeenCalledWith("reaction", "visitor-123", 10);
  });

  // API-SG-002: Non-rankable game → 400
  it("Non-rankable game → 400", async () => {
    mockIsRankableGame.mockReturnValue(false);

    const { request, context } = createRequest("dice");
    const res = await GET(request, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid game");
  });

  // API-SG-003: limit parameter 적용
  it("limit parameter 적용", async () => {
    const { request, context } = createRequest("reaction", { limit: "20" });

    await GET(request, context);

    expect(mockGetLeaderboard).toHaveBeenCalledWith("reaction", "visitor-123", 20);
  });

  // API-SG-004: limit max 50 (request 100 → capped at 50)
  it("limit max 50 (request 100 → capped at 50)", async () => {
    const { request, context } = createRequest("reaction", { limit: "100" });

    await GET(request, context);

    expect(mockGetLeaderboard).toHaveBeenCalledWith("reaction", "visitor-123", 50);
  });

  // API-SG-005: Cache-Control header (SEC-15: private, max-age=60)
  it("Cache-Control header with private max-age", async () => {
    const { request, context } = createRequest("reaction");

    const res = await GET(request, context);

    expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");
  });
});
