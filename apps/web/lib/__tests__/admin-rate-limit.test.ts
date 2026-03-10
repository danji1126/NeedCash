import { describe, it, expect, beforeEach, vi } from "vitest";

const kvStore = new Map<string, string>();

vi.mock("../env", () => ({
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

import { checkAdminRateLimit } from "../admin-rate-limit";

beforeEach(() => {
  kvStore.clear();
});

describe("checkAdminRateLimit", () => {
  it("첫 요청은 허용된다 (KV 비어있음)", async () => {
    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "1.2.3.4" },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);
  });

  it("19번째 요청까지 허용된다", async () => {
    kvStore.set("admin_rate:1.2.3.4", "18");
    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "1.2.3.4" },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);
    expect(kvStore.get("admin_rate:1.2.3.4")).toBe("19");
  });

  it("20번째 요청은 거부된다", async () => {
    kvStore.set("admin_rate:1.2.3.4", "20");
    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "1.2.3.4" },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(false);
  });

  it("서로 다른 IP는 독립적으로 카운트된다", async () => {
    kvStore.set("admin_rate:1.1.1.1", "20");
    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "2.2.2.2" },
    });

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);
    expect(kvStore.get("admin_rate:2.2.2.2")).toBe("1");
  });

  it("IP 헤더가 없으면 'unknown' 키를 사용한다", async () => {
    const request = new Request("https://example.com");

    const result = await checkAdminRateLimit(request);
    expect(result).toBe(true);
    expect(kvStore.get("admin_rate:unknown")).toBe("1");
  });
});
