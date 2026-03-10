import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  verifyAdminAuth: vi.fn(),
  unauthorizedResponse: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  setAnalyticsEnabled: vi.fn(),
  setThreshold: vi.fn(),
  getUsage: vi.fn(),
}));

vi.mock("@/lib/admin-rate-limit", () => ({
  checkAdminRateLimit: vi.fn(),
}));

import { GET, PUT } from "../admin/analytics/config/route";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { setAnalyticsEnabled, setThreshold, getUsage } from "@/lib/analytics";
import { checkAdminRateLimit } from "@/lib/admin-rate-limit";

const mockVerifyAdminAuth = vi.mocked(verifyAdminAuth);
const mockUnauthorizedResponse = vi.mocked(unauthorizedResponse);
const mockSetAnalyticsEnabled = vi.mocked(setAnalyticsEnabled);
const mockSetThreshold = vi.mocked(setThreshold);
const mockGetUsage = vi.mocked(getUsage);
const mockCheckAdminRateLimit = vi.mocked(checkAdminRateLimit);

const mockUsageData = {
  today: 150,
  threshold: 90000,
  enabled: true,
  autoOff: false,
};

function createRequest(method: string, body?: unknown): Request {
  const init: RequestInit = {
    method,
    headers: {
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request("http://localhost/api/admin/analytics/config", init);
}

function createInvalidJsonRequest(): Request {
  return new Request("http://localhost/api/admin/analytics/config", {
    method: "PUT",
    headers: {
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    },
    body: "not-json{{{",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockCheckAdminRateLimit.mockResolvedValue(true);
  mockVerifyAdminAuth.mockResolvedValue(true);
  mockGetUsage.mockResolvedValue(mockUsageData);
  mockUnauthorizedResponse.mockReturnValue(
    Response.json({ error: "Unauthorized" }, { status: 401 })
  );
});

describe("GET /api/admin/analytics/config", () => {
  // authenticated → 200, usage data
  it("authenticated → 200, usage data", async () => {
    const req = createRequest("GET");

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockUsageData);
  });

  // not authenticated → 401
  it("not authenticated → 401", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);

    const req = createRequest("GET");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  // rate limited → 429
  it("rate limited → 429", async () => {
    mockCheckAdminRateLimit.mockResolvedValue(false);

    const req = createRequest("GET");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe("Too many requests");
  });
});

describe("PUT /api/admin/analytics/config", () => {
  // toggle enabled=true → 200
  it("toggle enabled=true → 200", async () => {
    const req = createRequest("PUT", { enabled: true });

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(mockSetAnalyticsEnabled).toHaveBeenCalledWith(true, true);
  });

  // toggle enabled=false → 200
  it("toggle enabled=false → 200", async () => {
    const req = createRequest("PUT", { enabled: false });

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(mockSetAnalyticsEnabled).toHaveBeenCalledWith(false, true);
  });

  // set threshold → 200
  it("set threshold → 200", async () => {
    const req = createRequest("PUT", { threshold: 50000 });

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(mockSetThreshold).toHaveBeenCalledWith(50000);
  });

  // not authenticated → 401
  it("not authenticated → 401", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);

    const req = createRequest("PUT", { enabled: true });
    const res = await PUT(req);

    expect(res.status).toBe(401);
  });

  // rate limited → 429
  it("rate limited → 429", async () => {
    mockCheckAdminRateLimit.mockResolvedValue(false);

    const req = createRequest("PUT", { enabled: true });
    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe("Too many requests");
  });

  // invalid body → 400
  it("invalid JSON body → 400", async () => {
    const req = createInvalidJsonRequest();

    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid JSON");
  });

  // missing fields → handled gracefully (no setAnalyticsEnabled/setThreshold called)
  it("missing fields → handled gracefully", async () => {
    const req = createRequest("PUT", {});

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(mockSetAnalyticsEnabled).not.toHaveBeenCalled();
    expect(mockSetThreshold).not.toHaveBeenCalled();
    expect(mockGetUsage).toHaveBeenCalled();
  });
});
