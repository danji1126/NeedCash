const VISITOR_COOKIE = "ncv_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1년

export function getVisitorId(request: Request): {
  id: string;
  isNew: boolean;
} {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/ncv_id=([a-f0-9-]{36})/);
  if (match) return { id: match[1], isNew: false };
  return { id: crypto.randomUUID(), isNew: true };
}

export function setVisitorCookie(
  headers: Headers,
  visitorId: string
): void {
  headers.append(
    "Set-Cookie",
    `${VISITOR_COOKIE}=${visitorId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure; HttpOnly`
  );
}
