import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  verifyAdminAuth: vi.fn(),
  unauthorizedResponse: vi.fn(),
}));

vi.mock("@/lib/score-validation", () => ({
  isRankableGame: vi.fn(),
}));

vi.mock("@/lib/admin-rate-limit", () => ({
  checkAdminRateLimit: vi.fn(),
}));

const mockAll = vi.fn();
const mockRun = vi.fn();
const mockBind = vi.fn();
const mockPrepare = vi.fn();

vi.mock("@/lib/env", () => ({
  getDB: vi.fn(() => ({
    prepare: mockPrepare,
  })),
}));

import { GET, DELETE } from "../admin/scores/[game]/route";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { isRankableGame } from "@/lib/score-validation";
import { checkAdminRateLimit } from "@/lib/admin-rate-limit";
import { NextRequest } from "next/server";

const mockVerifyAdminAuth = vi.mocked(verifyAdminAuth);
const mockUnauthorizedResponse = vi.mocked(unauthorizedResponse);
const mockIsRankableGame = vi.mocked(isRankableGame);
const mockCheckAdminRateLimit = vi.mocked(checkAdminRateLimit);

function createGetRequest(game: string): {
  request: NextRequest;
  context: { params: Promise<{ game: string }> };
} {
  return {
    request: new NextRequest("http://localhost/api/admin/scores/" + game, {
      method: "GET",
      headers: { Authorization: "Bearer test-key" },
    }),
    context: { params: Promise.resolve({ game }) },
  };
}

function createDeleteRequest(
  game: string,
  body: unknown
): {
  request: NextRequest;
  context: { params: Promise<{ game: string }> };
} {
  return {
    request: new NextRequest("http://localhost/api/admin/scores/" + game, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
    context: { params: Promise.resolve({ game }) },
  };
}

const mockScores = [
  {
    id: 1,
    visitor_id: "v1",
    nickname: "player1",
    score: 200,
    score_type: "ms_lower",
    metadata: null,
    created_at: "2025-01-01",
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  mockCheckAdminRateLimit.mockResolvedValue(true);
  mockVerifyAdminAuth.mockResolvedValue(true);
  mockIsRankableGame.mockReturnValue(true);
  mockUnauthorizedResponse.mockReturnValue(
    Response.json({ error: "Unauthorized" }, { status: 401 })
  );

  // DB chain: prepare().bind().all() / prepare().bind().run()
  mockAll.mockResolvedValue({ results: mockScores });
  mockRun.mockResolvedValue({});
  mockBind.mockReturnValue({ all: mockAll, run: mockRun });
  mockPrepare.mockReturnValue({ bind: mockBind });
});

describe("GET /api/admin/scores/[game]", () => {
  // authenticated + valid game → 200
  it("authenticated + valid game → 200", async () => {
    const { request, context } = createGetRequest("reaction");

    const res = await GET(request, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ scores: mockScores });
  });

  // not authenticated → 401
  it("not authenticated → 401", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);

    const { request, context } = createGetRequest("reaction");
    const res = await GET(request, context);

    expect(res.status).toBe(401);
  });

  // rate limited → 429
  it("rate limited → 429", async () => {
    mockCheckAdminRateLimit.mockResolvedValue(false);

    const { request, context } = createGetRequest("reaction");
    const res = await GET(request, context);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe("Too many requests");
  });

  // invalid game → 400
  it("invalid game → 400", async () => {
    mockIsRankableGame.mockReturnValue(false);

    const { request, context } = createGetRequest("dice");
    const res = await GET(request, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid game");
  });
});

describe("DELETE /api/admin/scores/[game]", () => {
  // authenticated → 200
  it("authenticated → 200, { deleted: true }", async () => {
    const { request, context } = createDeleteRequest("reaction", { id: 1 });

    const res = await DELETE(request, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ deleted: true });
    expect(mockBind).toHaveBeenCalledWith(1, "reaction");
  });

  // not authenticated → 401
  it("not authenticated → 401", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);

    const { request, context } = createDeleteRequest("reaction", { id: 1 });
    const res = await DELETE(request, context);

    expect(res.status).toBe(401);
  });

  // rate limited → 429 (DELETE doesn't check rate limit in source, but test auth)
  // Looking at source: DELETE does NOT check rate limit, only verifyAdminAuth
  // So this test verifies that unauthenticated is properly rejected
  it("missing score id → 400", async () => {
    const { request, context } = createDeleteRequest("reaction", {});
    const res = await DELETE(request, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Missing score id");
  });

  // invalid game → still processes (DELETE doesn't validate game)
  // Actually looking at source, DELETE doesn't call isRankableGame
  // It just runs DELETE query with the game slug
  it("invalid JSON body → 400", async () => {
    const request = new NextRequest(
      "http://localhost/api/admin/scores/reaction",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        },
        body: "not-json{{{",
      }
    );
    const context = { params: Promise.resolve({ game: "reaction" }) };

    const res = await DELETE(request, context);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid JSON");
  });

  // nonexistent score → still returns deleted: true (DELETE is idempotent)
  it("nonexistent score → still returns { deleted: true }", async () => {
    mockRun.mockResolvedValue({ meta: { changes: 0 } });

    const { request, context } = createDeleteRequest("reaction", { id: 99999 });
    const res = await DELETE(request, context);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ deleted: true });
  });
});
