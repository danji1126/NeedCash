/**
 * 게임 세션 관리 (SEC-09)
 * 게임 시작 시 서버에서 세션 토큰 발급, 점수 제출 시 검증
 */
export async function startGameSession(
  gameSlug: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/scores/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlug }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sessionId: string };
    return data.sessionId;
  } catch {
    return null;
  }
}
