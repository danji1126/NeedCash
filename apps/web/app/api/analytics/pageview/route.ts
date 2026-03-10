import {
  isAnalyticsEnabled,
  incrementCounter,
} from "@/lib/analytics";
import { getKV } from "@/lib/env";

export async function POST(request: Request) {
  try {
    // IP 기반 rate limit (분당 100회)
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const kv = getKV();
    const rateKey = `pv_rate:${ip}`;
    const rateCount = parseInt((await kv.get(rateKey)) || "0");
    if (rateCount > 100) {
      return new Response(null, { status: 429 });
    }
    await kv.put(rateKey, String(rateCount + 1), { expirationTtl: 60 });

    const enabled = await isAnalyticsEnabled();
    if (!enabled) {
      return new Response(null, { status: 204 });
    }

    const count = await incrementCounter();

    const thresholdStr = await kv.get("analytics_threshold");
    const threshold = thresholdStr ? parseInt(thresholdStr) : 90_000;

    if (count >= threshold) {
      await kv.put("analytics_enabled", "false");
      await kv.put("analytics_auto_off", "true");
    }

    // Analytics Engine에 기록 (바인딩이 있을 때만)
    try {
      if (process.env.USE_LOCAL_DB !== "true") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getCloudflareContext } = require("@opennextjs/cloudflare");
        const { env } = getCloudflareContext();
        if (env.ANALYTICS) {
          const body = (await request.json().catch(() => ({}))) as {
            path?: string;
            referrer?: string;
          };
          env.ANALYTICS.writeDataPoint({
            blobs: [body.path || "/", body.referrer || ""],
            doubles: [1],
            indexes: [new Date().toISOString().split("T")[0]],
          });
        }
      }
    } catch {
      // AE 기록 실패해도 무시
    }

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
