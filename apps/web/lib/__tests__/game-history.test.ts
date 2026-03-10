// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getGameHistory,
  addGameHistory,
  clearGameHistory,
} from "@/lib/game-history";

const HISTORY_KEY = "needcash-game-history";

describe("game-history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getGameHistory", () => {
    it("빈 상태에서 빈 배열을 반환한다", () => {
      expect(getGameHistory()).toEqual([]);
    });

    it("game 파라미터로 특정 게임만 필터링한다", () => {
      const entries = [
        { id: "1", game: "reaction", score: 200, grade: "A", title: "매의 눈", metadata: {}, playedAt: "2026-01-01T00:00:00Z" },
        { id: "2", game: "typing", score: 50, grade: "C", title: "보통 타이피스트", metadata: {}, playedAt: "2026-01-01T00:01:00Z" },
        { id: "3", game: "reaction", score: 180, grade: "S", title: "번개", metadata: {}, playedAt: "2026-01-01T00:02:00Z" },
      ];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));

      const result = getGameHistory("reaction");
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.game === "reaction")).toBe(true);
    });

    it("잘못된 JSON이면 빈 배열을 반환한다", () => {
      localStorage.setItem(HISTORY_KEY, "invalid json!!!");
      expect(getGameHistory()).toEqual([]);
    });

    it("game 파라미터 없으면 전체를 반환한다", () => {
      const entries = [
        { id: "1", game: "reaction", score: 200, grade: "A", title: "t", metadata: {}, playedAt: "2026-01-01T00:00:00Z" },
        { id: "2", game: "typing", score: 50, grade: "C", title: "t", metadata: {}, playedAt: "2026-01-01T00:01:00Z" },
      ];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));

      expect(getGameHistory()).toHaveLength(2);
    });
  });

  describe("addGameHistory", () => {
    it("항목을 추가하면 자동으로 id와 playedAt가 설정된다", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid-1234");

      addGameHistory({
        game: "reaction",
        score: 200,
        grade: "A",
        title: "매의 눈",
        metadata: {},
      });

      const history = getGameHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("test-uuid-1234");
      expect(history[0].playedAt).toBeTruthy();
      expect(new Date(history[0].playedAt).toISOString()).toBe(history[0].playedAt);
    });

    it("최신 항목이 맨 앞에 추가된다", () => {
      addGameHistory({ game: "reaction", score: 100, grade: "F", title: "t1", metadata: {} });
      addGameHistory({ game: "reaction", score: 200, grade: "A", title: "t2", metadata: {} });

      const history = getGameHistory("reaction");
      expect(history[0].score).toBe(200);
      expect(history[1].score).toBe(100);
    });

    it("게임당 100개를 초과하면 오래된 항목이 제거된다", () => {
      for (let i = 0; i < 101; i++) {
        addGameHistory({ game: "reaction", score: i, grade: "C", title: "t", metadata: {} });
      }

      const history = getGameHistory("reaction");
      expect(history).toHaveLength(100);
      // 가장 최신(score=100)이 맨 앞
      expect(history[0].score).toBe(100);
    });
  });

  describe("clearGameHistory", () => {
    it("특정 게임의 히스토리만 삭제한다", () => {
      addGameHistory({ game: "reaction", score: 100, grade: "C", title: "t", metadata: {} });
      addGameHistory({ game: "typing", score: 50, grade: "C", title: "t", metadata: {} });

      clearGameHistory("reaction");

      expect(getGameHistory("reaction")).toHaveLength(0);
      expect(getGameHistory("typing")).toHaveLength(1);
    });

    it("game 없이 호출하면 전체 삭제한다", () => {
      addGameHistory({ game: "reaction", score: 100, grade: "C", title: "t", metadata: {} });
      addGameHistory({ game: "typing", score: 50, grade: "C", title: "t", metadata: {} });

      clearGameHistory();

      expect(getGameHistory()).toHaveLength(0);
      expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
    });
  });
});
