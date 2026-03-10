import { isAnalyticsEnabled } from "@/lib/analytics";

export async function GET() {
  try {
    const enabled = await isAnalyticsEnabled();
    return Response.json(
      { enabled },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/analytics/config]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
