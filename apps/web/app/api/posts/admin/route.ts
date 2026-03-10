import { getAllPostsAdminList } from "@/lib/db";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    if (!(await verifyAdminAuth(request))) return unauthorizedResponse();
    const posts = await getAllPostsAdminList();
    return Response.json(posts);
  } catch (error) {
    console.error("[GET /api/posts/admin]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
