import { describe, it, expect } from "vitest";
import { getVisitorId, setVisitorCookie } from "../visitor";

describe("getVisitorId", () => {
  it("유효한 UUID 쿠키가 있으면 기존 ID를 반환한다", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const request = new Request("https://example.com", {
      headers: { Cookie: `ncv_id=${uuid}` },
    });

    const result = getVisitorId(request);
    expect(result).toEqual({ id: uuid, isNew: false });
  });

  it("쿠키가 없으면 새 UUID를 생성한다", () => {
    const request = new Request("https://example.com");

    const result = getVisitorId(request);
    expect(result.isNew).toBe(true);
    expect(result.id).toMatch(/^[a-f0-9-]{36}$/);
  });

  it("잘못된 쿠키 형식이면 새 UUID를 생성한다", () => {
    const request = new Request("https://example.com", {
      headers: { Cookie: "ncv_id=invalid-format" },
    });

    const result = getVisitorId(request);
    expect(result.isNew).toBe(true);
    expect(result.id).toMatch(/^[a-f0-9-]{36}$/);
  });
});

describe("setVisitorCookie", () => {
  it("HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=31536000 속성을 설정한다", () => {
    const headers = new Headers();
    const visitorId = "550e8400-e29b-41d4-a716-446655440000";

    setVisitorCookie(headers, visitorId);

    const cookie = headers.get("Set-Cookie")!;
    expect(cookie).toContain(`ncv_id=${visitorId}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=31536000");
  });
});
