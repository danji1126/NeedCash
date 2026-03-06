import {
  isAnalyticsEnabled,
  incrementCounter,
  checkAutoBlock,
  getUsage,
} from "@/lib/analytics";

export async function POST(request: Request) {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) {
    return new Response(null, { status: 204 });
  }

  const count = await incrementCounter();

  const { threshold } = await getUsage();
  await checkAutoBlock(threshold);

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
    // AE 기록 실패해도 무시 (카운터는 이미 증가됨)
  }

  void count; // used for incrementing

  return new Response(null, { status: 204 });
}
