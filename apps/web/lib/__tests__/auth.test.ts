import { describe, it, expect, vi, beforeEach } from "vitest";

describe("verifyAdminAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.USE_LOCAL_DB = "true";
    process.env.ADMIN_API_KEY = "test-key-123";
  });

  it("유효 토큰 인증 성공", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer test-key-123" },
    });
    expect(await verifyAdminAuth(req)).toBe(true);
  });

  it("잘못된 토큰 인증 실패", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("Authorization 헤더 없음", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost");
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("환경변수 없으면 인증 실패", async () => {
    delete process.env.ADMIN_API_KEY;
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer anything" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("Bearer 접두사 없이 토큰만 전송 시 실패", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "test-key-123" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("Basic auth 형식 거부", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Basic dGVzdA==" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("Bearer 뒤 빈 토큰 실패", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer " },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("길이가 다른 토큰 timing-safe 비교 실패", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer short" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });
});

describe("unauthorizedResponse", () => {
  it("401 상태 코드 반환", async () => {
    const { unauthorizedResponse } = await import("../auth");
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
  });

  it("WWW-Authenticate: Bearer 헤더 포함", async () => {
    const { unauthorizedResponse } = await import("../auth");
    const res = unauthorizedResponse();
    expect(res.headers.get("WWW-Authenticate")).toBe("Bearer");
  });

  it("응답 본문에 { error: 'Unauthorized' } 포함", async () => {
    const { unauthorizedResponse } = await import("../auth");
    const res = unauthorizedResponse();
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
