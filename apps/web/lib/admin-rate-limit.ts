import { getKV } from "@/lib/env";

/**
 * IP 기반 Admin API rate limit (분당 20회)
 * 초과 시 false 반환
 */
export async function checkAdminRateLimit(request: Request): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const kv = getKV();
  const key = `admin_rate:${ip}`;

  const current = await kv.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= 20) return false;

  await kv.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}
