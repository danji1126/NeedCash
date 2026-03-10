import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("단일 클래스 문자열", () => {
    expect(cn("px-4")).toBe("px-4");
  });

  it("여러 클래스 병합", () => {
    expect(cn("px-4", "py-2", "text-sm")).toBe("px-4 py-2 text-sm");
  });

  it("falsy 값 필터링", () => {
    expect(cn("px-4", false && "hidden", null, undefined, "py-2")).toBe(
      "px-4 py-2"
    );
  });

  it("Tailwind 충돌 해결 (후자 우선)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("빈 입력", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });
});
