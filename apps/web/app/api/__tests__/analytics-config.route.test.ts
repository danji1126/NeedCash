import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/analytics", () => ({
  isAnalyticsEnabled: vi.fn(),
}));

import { GET } from "../analytics/config/route";
import { isAnalyticsEnabled } from "@/lib/analytics";

const mockIsEnabled = isAnalyticsEnabled as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/analytics/config", () => {
  it("analytics가 활성화되어 있으면 { enabled: true }를 반환한다", async () => {
    mockIsEnabled.mockResolvedValue(true);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ enabled: true });
  });

  it("analytics가 비활성화되어 있으면 { enabled: false }를 반환한다", async () => {
    mockIsEnabled.mockResolvedValue(false);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ enabled: false });
  });

  it("에러 발생 시 500을 반환한다", async () => {
    mockIsEnabled.mockRejectedValue(new Error("KV error"));

    const response = await GET();
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({ error: "Internal server error" });
  });
});
