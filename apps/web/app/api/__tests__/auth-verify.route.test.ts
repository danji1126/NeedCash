import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  verifyAdminAuth: vi.fn(),
  unauthorizedResponse: () =>
    Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    ),
}));

import { GET } from "../auth/verify/route";
import { verifyAdminAuth } from "@/lib/auth";

const mockVerify = verifyAdminAuth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/verify", () => {
  it("유효한 토큰이면 200 { ok: true }를 반환한다", async () => {
    mockVerify.mockResolvedValue(true);
    const request = new Request("https://example.com/api/auth/verify", {
      headers: { Authorization: "Bearer valid-token" },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ ok: true });
  });

  it("유효하지 않은 토큰이면 401을 반환한다", async () => {
    mockVerify.mockResolvedValue(false);
    const request = new Request("https://example.com/api/auth/verify", {
      headers: { Authorization: "Bearer invalid-token" },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("Authorization 헤더가 없으면 401을 반환한다", async () => {
    mockVerify.mockResolvedValue(false);
    const request = new Request("https://example.com/api/auth/verify");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
