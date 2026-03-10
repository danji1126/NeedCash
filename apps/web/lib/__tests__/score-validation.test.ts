import { describe, it, expect } from "vitest";
import {
  validateScore,
  validateNickname,
  isRankableGame,
  getScoreType,
} from "../score-validation";

describe("validateScore", () => {
  // reaction: min 100, max 2000
  it("reaction 경계값 (100, 2000)", () => {
    expect(validateScore("reaction", 100)).toBe(true);
    expect(validateScore("reaction", 2000)).toBe(true);
    expect(validateScore("reaction", 99)).toBe(false);
    expect(validateScore("reaction", 2001)).toBe(false);
  });

  it("reaction 유효 범위 내 값", () => {
    expect(validateScore("reaction", 150)).toBe(true);
    expect(validateScore("reaction", 500)).toBe(true);
  });

  // color-sense: min 1, max 50
  it("color-sense 경계값 (1, 50)", () => {
    expect(validateScore("color-sense", 1)).toBe(true);
    expect(validateScore("color-sense", 50)).toBe(true);
    expect(validateScore("color-sense", 0)).toBe(false);
    expect(validateScore("color-sense", 51)).toBe(false);
  });

  // color-memory: min 1, max 30
  it("color-memory 경계값 (1, 30)", () => {
    expect(validateScore("color-memory", 1)).toBe(true);
    expect(validateScore("color-memory", 30)).toBe(true);
    expect(validateScore("color-memory", 0)).toBe(false);
    expect(validateScore("color-memory", 31)).toBe(false);
  });

  // typing: min 0, max 250
  it("typing 경계값 (0, 250)", () => {
    expect(validateScore("typing", 0)).toBe(true);
    expect(validateScore("typing", 250)).toBe(true);
    expect(validateScore("typing", -1)).toBe(false);
    expect(validateScore("typing", 251)).toBe(false);
  });

  // math: min 0, max 120
  it("math 경계값 (0, 120)", () => {
    expect(validateScore("math", 0)).toBe(true);
    expect(validateScore("math", 120)).toBe(true);
    expect(validateScore("math", -1)).toBe(false);
    expect(validateScore("math", 121)).toBe(false);
  });

  it("소수점 점수 허용", () => {
    expect(validateScore("reaction", 150.5)).toBe(true);
    expect(validateScore("typing", 99.9)).toBe(true);
  });

  it("NaN 거부", () => {
    expect(validateScore("reaction", NaN)).toBe(false);
  });

  it("Infinity 거부", () => {
    expect(validateScore("reaction", Infinity)).toBe(false);
    expect(validateScore("reaction", -Infinity)).toBe(false);
  });
});

describe("validateNickname", () => {
  it("유효 영문 닉네임 허용", () => {
    expect(validateNickname("player1").valid).toBe(true);
  });

  it("유효 한글 닉네임 허용", () => {
    expect(validateNickname("플레이어").valid).toBe(true);
  });

  it("빈 문자열 허용 (익명)", () => {
    expect(validateNickname("").valid).toBe(true);
    expect(validateNickname("   ").valid).toBe(true);
  });

  it("2글자 거부 (최소 3자)", () => {
    expect(validateNickname("ab").valid).toBe(false);
  });

  it("3글자 허용", () => {
    expect(validateNickname("abc").valid).toBe(true);
  });

  it("12글자 허용", () => {
    expect(validateNickname("abcdefghijkl").valid).toBe(true);
  });

  it("13글자 거부 (최대 12자)", () => {
    expect(validateNickname("abcdefghijklm").valid).toBe(false);
  });

  it("특수문자 거부 (!, @, # 등)", () => {
    expect(validateNickname("play!er").valid).toBe(false);
    expect(validateNickname("pl@yer").valid).toBe(false);
    expect(validateNickname("play#1").valid).toBe(false);
  });

  it("언더스코어, 하이픈 허용", () => {
    expect(validateNickname("play_er").valid).toBe(true);
    expect(validateNickname("play-er").valid).toBe(true);
  });

  it("예약어 admin 거부 (대소문자 무관)", () => {
    expect(validateNickname("admin").valid).toBe(false);
    expect(validateNickname("Admin").valid).toBe(false);
    expect(validateNickname("ADMIN").valid).toBe(false);
  });

  it("예약어 관리자 거부", () => {
    expect(validateNickname("관리자").valid).toBe(false);
  });

  it("예약어 needcash 거부", () => {
    expect(validateNickname("needcash").valid).toBe(false);
    expect(validateNickname("NeedCash").valid).toBe(false);
  });

  it("예약어 system 거부", () => {
    expect(validateNickname("system").valid).toBe(false);
  });

  it("예약어 운영자 거부", () => {
    expect(validateNickname("운영자").valid).toBe(false);
  });

  it("에러 메시지 포함", () => {
    const result = validateNickname("ab");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("isRankableGame", () => {
  it.each(["reaction", "color-sense", "color-memory", "typing", "math"])(
    "%s → true",
    (game) => {
      expect(isRankableGame(game)).toBe(true);
    }
  );

  it.each(["dice", "lotto", "animal-face", "quiz"])(
    "%s → false",
    (game) => {
      expect(isRankableGame(game)).toBe(false);
    }
  );
});

describe("getScoreType", () => {
  it("reaction → ms_lower (ASC)", () => {
    expect(getScoreType("reaction")).toBe("ms_lower");
  });

  it("typing → higher (DESC)", () => {
    expect(getScoreType("typing")).toBe("higher");
  });

  it("math → higher (DESC)", () => {
    expect(getScoreType("math")).toBe("higher");
  });

  it("color-sense → higher (DESC)", () => {
    expect(getScoreType("color-sense")).toBe("higher");
  });

  it("color-memory → higher (DESC)", () => {
    expect(getScoreType("color-memory")).toBe("higher");
  });
});
