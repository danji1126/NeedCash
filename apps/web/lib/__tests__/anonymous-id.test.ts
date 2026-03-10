// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getAnonymousId } from "@/lib/anonymous-id";

const ANON_KEY = "needcash-anonymous-id";

describe("anonymous-id", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("localStorage에 ID가 없으면 새로 생성하여 저장한다", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("new-uuid-1234");

    const id = getAnonymousId();

    expect(id).toBe("new-uuid-1234");
    expect(localStorage.getItem(ANON_KEY)).toBe("new-uuid-1234");
  });

  it("localStorage에 기존 ID가 있으면 그대로 반환한다", () => {
    localStorage.setItem(ANON_KEY, "existing-uuid");

    const id = getAnonymousId();

    expect(id).toBe("existing-uuid");
  });

  it("동일 세션에서 여러 번 호출해도 같은 ID를 반환한다", () => {
    const id1 = getAnonymousId();
    const id2 = getAnonymousId();

    expect(id1).toBe(id2);
  });

  it("localStorage 값이 있으면 randomUUID를 호출하지 않는다", () => {
    localStorage.setItem(ANON_KEY, "existing-uuid");
    const spy = vi.spyOn(crypto, "randomUUID");

    getAnonymousId();

    expect(spy).not.toHaveBeenCalled();
  });
});
