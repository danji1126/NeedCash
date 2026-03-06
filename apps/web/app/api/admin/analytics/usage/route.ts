import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { getUsage } from "@/lib/analytics";

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const usage = await getUsage();
  return Response.json(usage);
}
