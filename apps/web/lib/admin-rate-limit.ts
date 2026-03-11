import { getDB } from "@/lib/env";

/**
 * D1 기반 원자적 Admin API rate limit (분당 20회)
 * SEC-10: TOCTOU 방지를 위해 ON CONFLICT DO UPDATE 사용
 */
export async function checkAdminRateLimit(request: Request): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const db = getDB();
  const minute = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  const key = `${ip}:${minute}`;

  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, datetime('now', '+1 minute'))
       ON CONFLICT(key) DO UPDATE SET count = count + 1
       RETURNING count`
    )
    .bind(key)
    .first<{ count: number }>();

  return (row?.count ?? 1) <= 20;
}

/**
 * 만료된 rate_limits 행 정리 (주기적 호출 권장)
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  const db = getDB();
  await db.prepare(`DELETE FROM rate_limits WHERE expires_at < datetime('now')`).run();
}
