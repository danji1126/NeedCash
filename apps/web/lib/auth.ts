import { getCloudflareContext } from "@opennextjs/cloudflare";

export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const { env } = getCloudflareContext();
  return token === env.ADMIN_API_KEY;
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}
