async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.byteLength !== bBuf.byteLength) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    aBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, bBuf);
  const expected = await crypto.subtle.sign("HMAC", key, aBuf);
  return arraysEqual(new Uint8Array(sig), new Uint8Array(expected));
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
