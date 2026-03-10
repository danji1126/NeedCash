import { describe, it, expect, beforeEach } from "vitest";
import { getDB, getKV, mockDB, mockKV, resetMocks } from "../../__mocks__/env";

describe("env mock", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("getDB → prepare 메서드를 가진 객체 반환", () => {
    const db = getDB();
    expect(db).toBeDefined();
    expect(typeof db.prepare).toBe("function");
    expect(db).toBe(mockDB);
  });

  it("getKV → get/put 메서드를 가진 객체 반환", () => {
    const kv = getKV();
    expect(typeof kv.get).toBe("function");
    expect(typeof kv.put).toBe("function");
    expect(kv).toBe(mockKV);
  });

  it("getKV: 없는 키 조회 시 null 반환", async () => {
    const kv = getKV();
    const result = await kv.get("nonexistent_key");
    expect(result).toBeNull();
  });

  it("getKV: 두 번 호출해도 데이터 공유 (싱글톤)", async () => {
    const kv1 = getKV();
    await kv1.put("shared_key", "shared_value");

    const kv2 = getKV();
    const result = await kv2.get("shared_key");
    expect(result).toBe("shared_value");
  });
});
