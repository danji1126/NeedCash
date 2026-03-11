async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  // SEC-08: HMAC으로 고정 길이 비교 — 길이 정보 누출 방지
  const keyMaterial = encoder.encode("needcash-hmac-comparison");
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(a)),
    crypto.subtle.sign("HMAC", key, encoder.encode(b)),
  ]);
  return arraysEqual(new Uint8Array(sigA), new Uint8Array(sigB));
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

export async function verifyAdminAuth(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);

  if (process.env.USE_LOCAL_DB === "true") {
    const key = process.env.ADMIN_API_KEY;
    if (!key) return false;
    return timingSafeCompare(token, key);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return timingSafeCompare(token, env.ADMIN_API_KEY);
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}
