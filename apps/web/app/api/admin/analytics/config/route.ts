import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import {
  setAnalyticsEnabled,
  setThreshold,
  getUsage,
} from "@/lib/analytics";

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const usage = await getUsage();
  return Response.json(usage);
}

export async function PUT(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const body = (await request.json()) as {
    enabled?: boolean;
    threshold?: number;
  };

  if (typeof body.enabled === "boolean") {
    await setAnalyticsEnabled(body.enabled, true);
  }

  if (typeof body.threshold === "number" && body.threshold > 0) {
    await setThreshold(body.threshold);
  }

  const usage = await getUsage();
  return Response.json(usage);
}
