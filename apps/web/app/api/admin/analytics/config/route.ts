import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import {
  setAnalyticsEnabled,
  setThreshold,
  getUsage,
} from "@/lib/analytics";
import { checkAdminRateLimit } from "@/lib/admin-rate-limit";

export async function GET(request: Request) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();
    const usage = await getUsage();
    return Response.json(usage);
  } catch (error) {
    console.error("[GET /api/admin/analytics/config]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (typeof body.enabled === "boolean") {
      await setAnalyticsEnabled(body.enabled, true);
    }

    if (typeof body.threshold === "number" && body.threshold > 0) {
      await setThreshold(body.threshold);
    }

    const usage = await getUsage();
    return Response.json(usage);
  } catch (error) {
    console.error("[PUT /api/admin/analytics/config]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
