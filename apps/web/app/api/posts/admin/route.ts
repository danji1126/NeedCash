import { getAllPostsAdmin } from "@/lib/db";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();
  const posts = await getAllPostsAdmin();
  return Response.json(posts);
}
