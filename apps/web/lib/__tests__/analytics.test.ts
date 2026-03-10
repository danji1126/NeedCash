import { describe, it, expect, beforeEach, vi } from "vitest";

// local-db + in-memory KV로 통합 테스트
const kvStore = new Map<string, string>();

vi.mock("../env", async () => {
  const localDb = await import("../local-db");
  const db = localDb.getLocalDB();

  return {
    getDB: () => db,
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
  };
});

const { getDB } = await import("../env");

import {
  isAnalyticsEnabled,
  setAnalyticsEnabled,
  incrementCounter,
  checkAutoBlock,
  getUsage,
  setThreshold,
} from "../analytics";

beforeEach(async () => {
  const db = getDB();
  await db.prepare("DELETE FROM analytics_counters").run();
  kvStore.clear();
});

// LIB-AN-001: isAnalyticsEnabled — KV 비어있으면 기본 true
describe("isAnalyticsEnabled", () => {
  it("KV에 값이 없으면 기본 true를 반환한다", async () => {
    const result = await isAnalyticsEnabled();
    expect(result).toBe(true);
  });

  // LIB-AN-002: isAnalyticsEnabled — KV "false"이면 false
  it('KV에 "false"가 저장되어 있으면 false를 반환한다', async () => {
    kvStore.set("analytics_enabled", "false");

    const result = await isAnalyticsEnabled();
    expect(result).toBe(false);
  });
});

// LIB-AN-003: setAnalyticsEnabled — true 설정
describe("setAnalyticsEnabled", () => {
  it('true를 설정하면 KV에 "true"가 저장된다', async () => {
    await setAnalyticsEnabled(true);
    expect(kvStore.get("analytics_enabled")).toBe("true");
  });

  // LIB-AN-004: setAnalyticsEnabled — manual=true면 auto_off 리셋
  it('manual=true이면 analytics_auto_off가 "false"로 리셋된다', async () => {
    kvStore.set("analytics_auto_off", "true");

    await setAnalyticsEnabled(true, true);

    expect(kvStore.get("analytics_auto_off")).toBe("false");
  });

  it("manual=false이면 analytics_auto_off를 변경하지 않는다", async () => {
    kvStore.set("analytics_auto_off", "true");

    await setAnalyticsEnabled(false, false);

    expect(kvStore.get("analytics_auto_off")).toBe("true");
  });
});

// LIB-AN-005: incrementCounter — 첫 호출 시 1
describe("incrementCounter", () => {
  it("첫 호출 시 1을 반환한다", async () => {
    const count = await incrementCounter();
    expect(count).toBe(1);
  });

  // LIB-AN-006: incrementCounter — 연속 3회 호출 시 3
  it("연속 3회 호출 시 3을 반환한다", async () => {
    await incrementCounter();
    await incrementCounter();
    const count = await incrementCounter();
    expect(count).toBe(3);
  });
});

// LIB-AN-007: checkAutoBlock — threshold 미만이면 false
describe("checkAutoBlock", () => {
  it("카운트가 threshold 미만이면 false를 반환한다", async () => {
    await incrementCounter(); // count = 1

    const blocked = await checkAutoBlock(100);
    expect(blocked).toBe(false);
  });

  // LIB-AN-008: checkAutoBlock — threshold 도달 시 true + KV 차단
  it("카운트가 threshold에 도달하면 true를 반환하고 KV를 차단 설정한다", async () => {
    await incrementCounter();
    await incrementCounter();

    const blocked = await checkAutoBlock(2);
    expect(blocked).toBe(true);

    expect(kvStore.get("analytics_enabled")).toBe("false");
    expect(kvStore.get("analytics_auto_off")).toBe("true");
  });
});

// LIB-AN-009: getUsage — 기본값
describe("getUsage", () => {
  it("초기 상태에서 기본값을 반환한다", async () => {
    const usage = await getUsage();
    expect(usage).toEqual({
      today: 0,
      threshold: 90_000,
      enabled: true,
      autoOff: false,
    });
  });

  // LIB-AN-010: getUsage — 설정된 값 반영
  it("설정된 값을 정확히 반영한다", async () => {
    await incrementCounter();
    await incrementCounter();
    await setThreshold(50_000);
    await setAnalyticsEnabled(false, false);
    kvStore.set("analytics_auto_off", "true");

    const usage = await getUsage();
    expect(usage).toEqual({
      today: 2,
      threshold: 50_000,
      enabled: false,
      autoOff: true,
    });
  });
});

// LIB-AN-011: setThreshold
describe("setThreshold", () => {
  it('50000을 설정하면 KV에 문자열 "50000"으로 저장된다', async () => {
    await setThreshold(50_000);
    expect(kvStore.get("analytics_threshold")).toBe("50000");
  });
});
