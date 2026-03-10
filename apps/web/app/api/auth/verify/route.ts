import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[GET /api/auth/verify]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
