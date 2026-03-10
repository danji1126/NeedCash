import { describe, it, expect, beforeEach, vi } from "vitest";
import { submitScore, getLeaderboard, checkRateLimit } from "../scores";

// local-db를 직접 사용하여 실제 D1 호환 DB로 통합 테스트
vi.mock("../env", async () => {
  const { getLocalDB } = await import("../local-db");
  const db = getLocalDB();
  return { getDB: () => db };
});

// 테스트 후 getDB() re-import
const { getDB } = await import("../env");

beforeEach(async () => {
  const db = getDB();
  await db.prepare("DELETE FROM game_scores").run();
  await db.prepare("DELETE FROM visitors").run();
});

// ─── submitScore ───

describe("submitScore", () => {
  // LIB-SCR-001: 정상 점수 제출 시 {id} 반환
  it("정상 점수 제출 시 {id} 반환", async () => {
    const result = await submitScore({
      visitorId: "visitor-1",
      gameSlug: "reaction",
      score: 200,
      nickname: "tester",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    expect(result.id).toBeGreaterThan(0);
  });

  // LIB-SCR-002: 새 visitor 자동 생성
  it("새 visitor 자동 생성", async () => {
    await submitScore({
      visitorId: "new-visitor",
      gameSlug: "typing",
      score: 80,
      nickname: null,
    });

    const db = getDB();
    const row = await db
      .prepare("SELECT * FROM visitors WHERE id = ?")
      .bind("new-visitor")
      .first<{ id: string; visit_count: number }>();

    expect(row).not.toBeNull();
    expect(row!.id).toBe("new-visitor");
  });

  // LIB-SCR-003: 기존 visitor visit_count 증가
  it("기존 visitor visit_count 증가", async () => {
    const db = getDB();
    await db.prepare("INSERT INTO visitors (id) VALUES (?)").bind("existing-visitor").run();

    const before = await db
      .prepare("SELECT visit_count FROM visitors WHERE id = ?")
      .bind("existing-visitor")
      .first<{ visit_count: number }>();

    await submitScore({
      visitorId: "existing-visitor",
      gameSlug: "math",
      score: 10,
      nickname: null,
    });

    const after = await db
      .prepare("SELECT visit_count FROM visitors WHERE id = ?")
      .bind("existing-visitor")
      .first<{ visit_count: number }>();

    expect(after!.visit_count).toBe(before!.visit_count + 1);
  });

  // LIB-SCR-004: nickname null 저장
  it("nickname null 저장", async () => {
    const result = await submitScore({
      visitorId: "visitor-null-nick",
      gameSlug: "reaction",
      score: 300,
      nickname: null,
    });

    const db = getDB();
    const row = await db
      .prepare("SELECT nickname FROM game_scores WHERE id = ?")
      .bind(result.id)
      .first<{ nickname: string | null }>();

    expect(row!.nickname).toBeNull();
  });

  // LIB-SCR-005: metadata JSON 직렬화
  it("metadata JSON 직렬화", async () => {
    const metadata = { rounds: 5, difficulty: "hard" };
    const result = await submitScore({
      visitorId: "visitor-meta",
      gameSlug: "math",
      score: 15,
      nickname: "metaPlayer",
      metadata,
    });

    const db = getDB();
    const row = await db
      .prepare("SELECT metadata FROM game_scores WHERE id = ?")
      .bind(result.id)
      .first<{ metadata: string | null }>();

    expect(row!.metadata).not.toBeNull();
    expect(JSON.parse(row!.metadata!)).toEqual(metadata);
  });
});

// ─── getLeaderboard ───

describe("getLeaderboard", () => {
  // LIB-SCR-006: ASC 정렬 (reaction)
  it("ASC 정렬 (reaction: 150,200,100 → [100,150,200])", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "reaction", score: 150, nickname: null });
    await submitScore({ visitorId: "v2", gameSlug: "reaction", score: 200, nickname: null });
    await submitScore({ visitorId: "v3", gameSlug: "reaction", score: 100, nickname: null });

    const result = await getLeaderboard("reaction", null);

    expect(result.leaderboard.map((e) => e.score)).toEqual([100, 150, 200]);
    expect(result.leaderboard[0].rank).toBe(1);
    expect(result.leaderboard[1].rank).toBe(2);
    expect(result.leaderboard[2].rank).toBe(3);
  });

  // LIB-SCR-007: DESC 정렬 (typing)
  it("DESC 정렬 (typing: 50,100,80 → [100,80,50])", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "typing", score: 50, nickname: null });
    await submitScore({ visitorId: "v2", gameSlug: "typing", score: 100, nickname: null });
    await submitScore({ visitorId: "v3", gameSlug: "typing", score: 80, nickname: null });

    const result = await getLeaderboard("typing", null);

    expect(result.leaderboard.map((e) => e.score)).toEqual([100, 80, 50]);
  });

  // LIB-SCR-008: limit 적용
  it("limit 적용", async () => {
    for (let i = 1; i <= 5; i++) {
      await submitScore({ visitorId: `v${i}`, gameSlug: "math", score: i * 10, nickname: null });
    }

    const result = await getLeaderboard("math", null, 3);

    expect(result.leaderboard).toHaveLength(3);
  });

  // LIB-SCR-009: total은 DISTINCT visitor_id 카운트
  it("total은 DISTINCT visitor_id 카운트", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "reaction", score: 150, nickname: null });
    await submitScore({ visitorId: "v1", gameSlug: "reaction", score: 140, nickname: null });
    await submitScore({ visitorId: "v2", gameSlug: "reaction", score: 200, nickname: null });

    const result = await getLeaderboard("reaction", null);

    expect(result.total).toBe(2);
  });

  // LIB-SCR-010: myRank 정상 반환
  it("myRank 정상 반환", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "reaction", score: 100, nickname: "first" });
    await submitScore({ visitorId: "v2", gameSlug: "reaction", score: 200, nickname: "second" });
    await submitScore({ visitorId: "v3", gameSlug: "reaction", score: 300, nickname: "third" });

    const result = await getLeaderboard("reaction", "v2");

    expect(result.myRank).not.toBeNull();
    expect(result.myRank!.score).toBe(200);
    expect(result.myRank!.rank).toBe(2);
    expect(result.myRank!.nickname).toBe("second");
  });

  // LIB-SCR-011: visitorId null → myRank null
  it("visitorId null → myRank null", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "typing", score: 80, nickname: null });

    const result = await getLeaderboard("typing", null);

    expect(result.myRank).toBeNull();
  });

  // LIB-SCR-012: 점수 없는 visitor → myRank null
  it("점수 없는 visitor → myRank null", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "typing", score: 80, nickname: null });

    const result = await getLeaderboard("typing", "no-scores-visitor");

    expect(result.myRank).toBeNull();
  });

  // LIB-SCR-013: 빈 리더보드
  it("빈 리더보드", async () => {
    const result = await getLeaderboard("math", null);

    expect(result.leaderboard).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.myRank).toBeNull();
  });
});

// ─── checkRateLimit ───

describe("checkRateLimit", () => {
  // LIB-SCR-014: 첫 제출 → true
  it("첫 제출 → true (기록 없음)", async () => {
    const allowed = await checkRateLimit("new-visitor", "reaction");

    expect(allowed).toBe(true);
  });

  // LIB-SCR-015: 60초 이내 → false
  it("60초 이내 제출 → false", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "reaction", score: 200, nickname: null });

    const allowed = await checkRateLimit("v1", "reaction");

    expect(allowed).toBe(false);
  });

  // LIB-SCR-016: 60초 이후 → true
  it("60초 이후 제출 → true", async () => {
    await submitScore({ visitorId: "v1", gameSlug: "reaction", score: 200, nickname: null });

    // created_at을 2분 전으로 조작
    const db = getDB();
    await db
      .prepare(
        `UPDATE game_scores SET created_at = datetime('now', '-120 seconds')
         WHERE visitor_id = ? AND game_slug = ?`
      )
      .bind("v1", "reaction")
      .run();

    const allowed = await checkRateLimit("v1", "reaction");

    expect(allowed).toBe(true);
  });
});
