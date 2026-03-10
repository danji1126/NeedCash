import { describe, it, expect, vi, beforeEach } from "vitest";

const kvStore = new Map<string, string>();

vi.mock("@/lib/analytics", () => ({
  isAnalyticsEnabled: vi.fn(),
  incrementCounter: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getKV: () =>
    ({
      get: async (key: string) => kvStore.get(key) ?? null,
      put: async (key: string, value: string) => {
        kvStore.set(key, value);
      },
      delete: async (key: string) => {
        kvStore.delete(key);
      },
    }) as unknown as KVNamespace,
}));

import { POST } from "../analytics/pageview/route";
import { isAnalyticsEnabled, incrementCounter } from "@/lib/analytics";

const mockIsEnabled = isAnalyticsEnabled as ReturnType<typeof vi.fn>;
const mockIncrement = incrementCounter as ReturnType<typeof vi.fn>;

beforeEach(() => {
  kvStore.clear();
  vi.clearAllMocks();
  mockIsEnabled.mockResolvedValue(true);
  mockIncrement.mockResolvedValue(1);
});

function createRequest(options: {
  ip?: string;
  body?: Record<string, unknown>;
} = {}) {
  const headers: Record<string, string> = {};
  if (options.ip) headers["CF-Connecting-IP"] = options.ip;

  return new Request("https://example.com/api/analytics/pageview", {
    method: "POST",
    headers,
    body: options.body ? JSON.stringify(options.body) : null,
  });
}

describe("POST /api/analytics/pageview", () => {
  it("정상적인 pageview 요청 시 204를 반환한다", async () => {
    const request = createRequest({
      ip: "1.2.3.4",
      body: { path: "/blog" },
    });

    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(mockIncrement).toHaveBeenCalled();
  });

  it("analytics가 비활성화되면 카운터를 증가시키지 않고 204를 반환한다", async () => {
    mockIsEnabled.mockResolvedValue(false);
    const request = createRequest({ ip: "1.2.3.4" });

    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(mockIncrement).not.toHaveBeenCalled();
  });

  it("rate limit 초과 시 429를 반환한다", async () => {
    kvStore.set("pv_rate:1.2.3.4", "101");
    const request = createRequest({ ip: "1.2.3.4" });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it("threshold 도달 시 자동 차단을 설정한다", async () => {
    mockIncrement.mockResolvedValue(90000);
    const request = createRequest({ ip: "1.2.3.4" });

    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(kvStore.get("analytics_enabled")).toBe("false");
    expect(kvStore.get("analytics_auto_off")).toBe("true");
  });

  it("새 방문자의 rate count를 증가시킨다", async () => {
    const request = createRequest({ ip: "5.5.5.5" });

    await POST(request);
    expect(kvStore.get("pv_rate:5.5.5.5")).toBe("1");
  });

  it("IP 헤더가 없으면 'unknown' 키를 사용한다", async () => {
    const request = createRequest();

    await POST(request);
    expect(kvStore.get("pv_rate:unknown")).toBe("1");
  });

  it("에러 발생 시에도 204를 반환한다 (graceful)", async () => {
    mockIsEnabled.mockRejectedValue(new Error("KV error"));
    // rate limit 체크 후 isAnalyticsEnabled에서 에러 → catch 블록 → 204
    const request = createRequest({ ip: "1.2.3.4" });

    const response = await POST(request);
    expect(response.status).toBe(204);
  });
});
