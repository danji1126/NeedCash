import { isAnalyticsEnabled } from "@/lib/analytics";

export async function GET() {
  const enabled = await isAnalyticsEnabled();
  return Response.json(
    { enabled },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    }
  );
}
