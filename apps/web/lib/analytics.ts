import { getDB, getKV } from "./env";

export async function isAnalyticsEnabled(): Promise<boolean> {
  const kv = getKV();
  const enabled = await kv.get("analytics_enabled");
  return enabled !== "false";
}

export async function setAnalyticsEnabled(
  enabled: boolean,
  manual: boolean = true
): Promise<void> {
  const kv = getKV();
  await kv.put("analytics_enabled", enabled ? "true" : "false");
  if (manual) {
    await kv.put("analytics_auto_off", "false");
  }
}

export async function incrementCounter(): Promise<number> {
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  await db
    .prepare(
      `INSERT INTO analytics_counters (date, count) VALUES (?, 1)
       ON CONFLICT(date) DO UPDATE SET count = count + 1`
    )
    .bind(today)
    .run();

  const row = await db
    .prepare(`SELECT count FROM analytics_counters WHERE date = ?`)
    .bind(today)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function checkAutoBlock(threshold: number): Promise<boolean> {
  const db = getDB();
  const today = new Date().toISOString().split("T")[0];
  const row = await db
    .prepare(`SELECT count FROM analytics_counters WHERE date = ?`)
    .bind(today)
    .first<{ count: number }>();

  if (row && row.count >= threshold) {
    const kv = getKV();
    await kv.put("analytics_enabled", "false");
    await kv.put("analytics_auto_off", "true");
    return true;
  }
  return false;
}

export async function getUsage(): Promise<{
  today: number;
  threshold: number;
  enabled: boolean;
  autoOff: boolean;
}> {
  const db = getDB();
  const kv = getKV();
  const today = new Date().toISOString().split("T")[0];

  const row = await db
    .prepare(`SELECT count FROM analytics_counters WHERE date = ?`)
    .bind(today)
    .first<{ count: number }>();

  const [thresholdStr, enabledStr, autoOffStr] = await Promise.all([
    kv.get("analytics_threshold"),
    kv.get("analytics_enabled"),
    kv.get("analytics_auto_off"),
  ]);

  return {
    today: row?.count ?? 0,
    threshold: thresholdStr ? parseInt(thresholdStr) : 90_000,
    enabled: enabledStr !== "false",
    autoOff: autoOffStr === "true",
  };
}

export async function setThreshold(threshold: number): Promise<void> {
  const kv = getKV();
  await kv.put("analytics_threshold", String(threshold));
}

