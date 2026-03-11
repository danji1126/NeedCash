import { describe, it, expect, beforeEach, vi } from "vitest";

// D1 mock — rate_limits 테이블의 INSERT ... ON CONFLICT 시뮬레이션
const rateLimits = new Map<string, number>();

vi.mock("../env", () => ({
  getDB: () => ({
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => {
        const key = args[0] as string;
        return {
          first: async () => {
            if (sql.includes("INSERT INTO rate_limits")) {
              const current = rateLimits.get(key) || 0;
              rateLimits.set(key, current + 1);
              return { count: current + 1 };
            }
            return null;
          },
          run: async () => ({}),
        };
      },
    }),
  }),
}));

import { checkAdminRateLimit } from "../admin-rate-limit";

beforeEach(() => {
  rateLimits.clear();
});

describe("checkAdminRateLimit (D1 기반)", () => {
  it("첫 요청은 허용된다", async () => {
    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "1.2.3.4" },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);
  });

  it("20번째 요청까지 허용된다", async () => {
    const ip = "1.2.3.4";
    const minute = new Date().toISOString().slice(0, 16);
    const key = `${ip}:${minute}`;
    rateLimits.set(key, 19);

    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": ip },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);
    expect(rateLimits.get(key)).toBe(20);
  });

  it("21번째 요청은 거부된다", async () => {
    const ip = "1.2.3.4";
    const minute = new Date().toISOString().slice(0, 16);
    const key = `${ip}:${minute}`;
    rateLimits.set(key, 20);

    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": ip },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(false);
  });

  it("서로 다른 IP는 독립적으로 카운트된다", async () => {
    const minute = new Date().toISOString().slice(0, 16);
    rateLimits.set(`1.1.1.1:${minute}`, 20);

    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "2.2.2.2" },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);
  });

  it("IP 헤더가 없으면 'unknown' 키를 사용한다", async () => {
    const request = new Request("https://example.com");
    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);

    const minute = new Date().toISOString().slice(0, 16);
    expect(rateLimits.get(`unknown:${minute}`)).toBe(1);
  });
});
