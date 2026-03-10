import { describe, it, expect } from "vitest";
import { getGameContent, getRelatedGames } from "@/lib/game-content";

describe("game-content", () => {
  describe("getGameContent", () => {
    it("존재하는 slug의 콘텐츠를 반환한다", () => {
      const content = getGameContent("reaction");
      expect(content).toBeDefined();
      expect(content!.slug).toBe("reaction");
      expect(content!.introduction).toBeTruthy();
      expect(content!.howToPlay).toBeInstanceOf(Array);
    });

    it("미존재 slug에 대해 undefined를 반환한다", () => {
      expect(getGameContent("non-existent")).toBeUndefined();
    });

    it("모든 등록 게임의 콘텐츠가 존재한다", () => {
      const slugs = ["dice", "lotto", "animal-face", "reaction", "color-sense", "color-memory", "typing", "math", "quiz"];
      for (const slug of slugs) {
        expect(getGameContent(slug)).toBeDefined();
      }
    });
  });

  describe("getRelatedGames", () => {
    it("현재 게임을 제외한 관련 게임 목록을 반환한다", () => {
      const related = getRelatedGames("reaction");
      expect(related.every((g) => g.slug !== "reaction")).toBe(true);
    });

    it("기본 count=3개를 반환한다", () => {
      const related = getRelatedGames("reaction");
      expect(related).toHaveLength(3);
    });

    it("count 파라미터로 개수를 지정할 수 있다", () => {
      const related = getRelatedGames("reaction", 5);
      expect(related).toHaveLength(5);
    });
  });
});
