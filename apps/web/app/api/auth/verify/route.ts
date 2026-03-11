import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";
import { checkAdminRateLimit } from "@/lib/admin-rate-limit";

export async function GET(request: Request) {
  try {
    if (!(await checkAdminRateLimit(request))) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[GET /api/auth/verify]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
