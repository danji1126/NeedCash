export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);

  if (process.env.USE_LOCAL_DB === "true") {
    return token === (process.env.ADMIN_API_KEY ?? "dev-secret-key");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return token === env.ADMIN_API_KEY;
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}
