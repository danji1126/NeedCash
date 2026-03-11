import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/scores", () => ({
  submitScore: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/score-validation", () => ({
  isRankableGame: vi.fn(),
  validateScore: vi.fn(),
  validateNickname: vi.fn(),
}));

vi.mock("@/lib/visitor", () => ({
  getVisitorId: vi.fn(),
  setVisitorCookie: vi.fn(),
}));

const kvStore = new Map<string, string>();
vi.mock("@/lib/env", () => ({
  getKV: () =>
    ({
      get: async (key: string) => kvStore.get(key) ?? null,
      put: async (key: string, value: string) => {
        kvStore.set(key, value);
      },
    }) as unknown as KVNamespace,
  getDB: () => ({
    prepare: () => ({
      bind: () => ({
        first: async () => ({ started_at: Date.now() - 10000, used: 0 }),
        run: async () => ({}),
      }),
    }),
  }),
}));

import { POST } from "../scores/route";
import { submitScore, checkRateLimit } from "@/lib/scores";
import {
  isRankableGame,
  validateScore,
  validateNickname,
} from "@/lib/score-validation";
import { getVisitorId, setVisitorCookie } from "@/lib/visitor";
import { NextRequest } from "next/server";

const mockSubmitScore = vi.mocked(submitScore);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIsRankableGame = vi.mocked(isRankableGame);
const mockValidateScore = vi.mocked(validateScore);
const mockValidateNickname = vi.mocked(validateNickname);
const mockGetVisitorId = vi.mocked(getVisitorId);
const mockSetVisitorCookie = vi.mocked(setVisitorCookie);

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "test-session", ...body }),
  });
}

function createInvalidJsonRequest(): NextRequest {
  return new NextRequest("http://localhost/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{{{",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  kvStore.clear();
  // Default happy path mocks
  mockIsRankableGame.mockReturnValue(true);
  mockValidateScore.mockReturnValue(true);
  mockValidateNickname.mockReturnValue({ valid: true });
  mockGetVisitorId.mockReturnValue({ id: "visitor-123", isNew: false });
  mockCheckRateLimit.mockResolvedValue(true);
  mockSubmitScore.mockResolvedValue({ id: 42 });
});

describe("POST /api/scores", () => {
  // API-SCR-001: 정상 제출 → 201, { id }
  it("정상 제출 → 201, { id }", async () => {
    const req = createRequest({
      gameSlug: "reaction",
      score: 200,
      nickname: "tester",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual({ id: 42 });
    expect(mockSubmitScore).toHaveBeenCalledWith({
      visitorId: "visitor-123",
      gameSlug: "reaction",
      score: 200,
      nickname: "tester",
      metadata: undefined,
    });
  });

  // API-SCR-002: Invalid JSON body → 400
  it("Invalid JSON body → 400", async () => {
    const req = createInvalidJsonRequest();

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid JSON");
  });

  // API-SCR-003: Non-rankable game → 400
  it("Non-rankable game (dice) → 400", async () => {
    mockIsRankableGame.mockReturnValue(false);

    const req = createRequest({ gameSlug: "dice", score: 6 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid game");
  });

  // API-SCR-004: Score out of range → 400
  it("Score out of range → 400", async () => {
    mockValidateScore.mockReturnValue(false);

    const req = createRequest({ gameSlug: "reaction", score: 99999 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid score");
  });

  // API-SCR-005: Metadata > 1KB → 400
  it("Metadata > 1KB → 400", async () => {
    const largeMetadata = { data: "x".repeat(1100) };

    const req = createRequest({
      gameSlug: "reaction",
      score: 200,
      metadata: largeMetadata,
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Metadata too large");
  });

  // API-SCR-006: Nickname validation failure → 400
  it("Nickname validation failure → 400", async () => {
    mockValidateNickname.mockReturnValue({
      valid: false,
      error: "사용할 수 없는 닉네임",
    });

    const req = createRequest({
      gameSlug: "reaction",
      score: 200,
      nickname: "admin",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("사용할 수 없는 닉네임");
  });

  // API-SCR-007: Rate limit exceeded → 429
  it("Rate limit exceeded → 429", async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const req = createRequest({ gameSlug: "reaction", score: 200 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe("Too fast");
    expect(data.retryAfter).toBe(60);
  });

  // API-SCR-008: New visitor → Set-Cookie header present
  it("New visitor → Set-Cookie header present", async () => {
    mockGetVisitorId.mockReturnValue({ id: "new-visitor-456", isNew: true });

    const req = createRequest({ gameSlug: "reaction", score: 200 });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockSetVisitorCookie).toHaveBeenCalled();
  });
});
