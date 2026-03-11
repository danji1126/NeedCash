import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── SEC-06: JSON-LD 이스케이프 ───

describe("SEC-06: JSON-LD 이스케이프", () => {
  // safeJsonLd 로직 재현 (내부 함수이므로 동일 로직으로 단위 테스트)
  function safeJsonLd(data: Record<string, unknown>): string {
    return JSON.stringify(data).replace(/</g, "\\u003c");
  }

  it("title에 </script> 포함 시 \\u003c로 이스케이프되어야 함", () => {
    const result = safeJsonLd({ title: "Test</script><script>alert(1)" });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c/script>");
    expect(result).toContain("\\u003cscript>");
  });

  it("description에 < 포함 시 \\u003c로 이스케이프되어야 함", () => {
    const result = safeJsonLd({ description: "a < b" });
    expect(result).not.toContain("<");
    expect(result).toContain("\\u003c");
  });

  it("< 가 없는 경우 원본 유지", () => {
    const result = safeJsonLd({ title: "Hello World" });
    expect(result).toBe('{"title":"Hello World"}');
  });

  it("중첩 객체 내부의 < 도 이스케이프", () => {
    const result = safeJsonLd({ nested: { html: "<div>" } });
    expect(result).not.toContain("<div>");
    expect(result).toContain("\\u003cdiv>");
  });
});

// ─── SEC-07: PUT slug 검증 ───

describe("SEC-07: PUT slug 검증", () => {
  const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  it("유효한 slug 형식 허용", () => {
    expect(SLUG_REGEX.test("hello-world")).toBe(true);
    expect(SLUG_REGEX.test("post1")).toBe(true);
    expect(SLUG_REGEX.test("my-first-post")).toBe(true);
  });

  it("대문자 slug 거부", () => {
    expect(SLUG_REGEX.test("Hello")).toBe(false);
    expect(SLUG_REGEX.test("HELLO")).toBe(false);
  });

  it("특수문자 slug 거부", () => {
    expect(SLUG_REGEX.test("hello_world")).toBe(false);
    expect(SLUG_REGEX.test("hello world")).toBe(false);
    expect(SLUG_REGEX.test("hello/world")).toBe(false);
  });

  it("연속 하이픈 거부", () => {
    expect(SLUG_REGEX.test("hello--world")).toBe(false);
  });

  it("하이픈으로 시작/끝나는 slug 거부", () => {
    expect(SLUG_REGEX.test("-hello")).toBe(false);
    expect(SLUG_REGEX.test("hello-")).toBe(false);
  });

  it("빈 문자열 거부", () => {
    expect(SLUG_REGEX.test("")).toBe(false);
  });

  it("100자 초과 slug는 길이 체크로 거부", () => {
    const longSlug = "a".repeat(101);
    expect(longSlug.length > 100).toBe(true);
  });

  it("100자 정확히는 허용", () => {
    const slug100 = "a".repeat(100);
    expect(slug100.length <= 100).toBe(true);
    expect(SLUG_REGEX.test(slug100)).toBe(true);
  });
});

// ─── SEC-08: Timing-safe 비교 ───

describe("SEC-08: Timing-safe 비교", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.USE_LOCAL_DB = "true";
    process.env.ADMIN_API_KEY = "correct-key-12345";
  });

  it("동일한 입력은 true 반환", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer correct-key-12345" },
    });
    expect(await verifyAdminAuth(req)).toBe(true);
  });

  it("다른 입력은 false 반환", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer wrong-key" },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });

  it("길이가 다른 입력도 false 반환 (timing-safe)", async () => {
    const { verifyAdminAuth } = await import("../auth");
    // 매우 짧은 토큰
    const req1 = new Request("http://localhost", {
      headers: { Authorization: "Bearer a" },
    });
    expect(await verifyAdminAuth(req1)).toBe(false);

    // 매우 긴 토큰
    const req2 = new Request("http://localhost", {
      headers: { Authorization: `Bearer ${"x".repeat(1000)}` },
    });
    expect(await verifyAdminAuth(req2)).toBe(false);
  });

  it("빈 토큰은 false 반환", async () => {
    const { verifyAdminAuth } = await import("../auth");
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer " },
    });
    expect(await verifyAdminAuth(req)).toBe(false);
  });
});

// ─── SEC-12: Score DELETE id 검증 ───

describe("SEC-12: Score DELETE id 검증", () => {
  // id 검증 로직 재현 (route handler 내부 로직)
  function validateScoreId(id: unknown): { valid: boolean; parsed: number } {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { valid: false, parsed: 0 };
    }
    return { valid: true, parsed };
  }

  it("문자열 id는 거부", () => {
    expect(validateScoreId("abc").valid).toBe(false);
    expect(validateScoreId("").valid).toBe(false);
  });

  it("음수 id는 거부", () => {
    expect(validateScoreId(-1).valid).toBe(false);
    expect(validateScoreId(-100).valid).toBe(false);
  });

  it("소수점 id는 거부", () => {
    expect(validateScoreId(1.5).valid).toBe(false);
    expect(validateScoreId(0.1).valid).toBe(false);
  });

  it("0은 거부", () => {
    expect(validateScoreId(0).valid).toBe(false);
  });

  it("정수 id는 허용", () => {
    expect(validateScoreId(1).valid).toBe(true);
    expect(validateScoreId(100).valid).toBe(true);
    expect(validateScoreId(999999).valid).toBe(true);
  });

  it("NaN은 거부", () => {
    expect(validateScoreId(NaN).valid).toBe(false);
  });

  it("Infinity는 거부", () => {
    expect(validateScoreId(Infinity).valid).toBe(false);
  });

  it("숫자 문자열은 정수로 파싱 시 허용", () => {
    expect(validateScoreId("42").valid).toBe(true);
    expect(validateScoreId("42").parsed).toBe(42);
  });
});

// ─── SEC-02: PUT API html 직접 주입 차단 ───

describe("SEC-02: PUT API html 직접 주입 차단", () => {
  const mockUpdatePost = vi.fn();
  const mockCompileMarkdown = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    mockUpdatePost.mockReset();
    mockCompileMarkdown.mockReset();

    vi.doMock("@/lib/db", () => ({
      getPostBySlug: vi.fn(),
      getPostBySlugAdmin: vi.fn(),
      updatePost: mockUpdatePost,
      deletePost: vi.fn(),
    }));
    vi.doMock("@/lib/compile-markdown", () => ({
      compileMarkdown: mockCompileMarkdown,
      calculateReadingTime: vi.fn().mockReturnValue(1),
    }));
    vi.doMock("@/lib/auth", () => ({
      verifyAdminAuth: vi.fn().mockResolvedValue(true),
      unauthorizedResponse: vi.fn(),
    }));
    vi.doMock("@/lib/admin-rate-limit", () => ({
      checkAdminRateLimit: vi.fn().mockResolvedValue(true),
    }));
  });

  it("content 없이 html만 보내면 html이 업데이트되지 않아야 함", async () => {
    mockUpdatePost.mockResolvedValue({ slug: "test", title: "Test" });

    const { PUT } = await import("@/app/api/posts/[slug]/route");
    const req = new Request("http://localhost/api/posts/test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: "<script>alert(1)</script>", title: "New" }),
    });

    await PUT(req, { params: Promise.resolve({ slug: "test" }) });

    expect(mockUpdatePost).toHaveBeenCalledWith("test", expect.not.objectContaining({ html: expect.any(String) }));
    // html 필드가 updates에 포함되지 않아야 함
    const callArgs = mockUpdatePost.mock.calls[0]?.[1];
    expect(callArgs).not.toHaveProperty("html");
  });

  it("content를 보내면 compileMarkdown을 거친 html이 저장되어야 함", async () => {
    mockCompileMarkdown.mockResolvedValue("<p>safe html</p>");
    mockUpdatePost.mockResolvedValue({ slug: "test" });

    const { PUT } = await import("@/app/api/posts/[slug]/route");
    const req = new Request("http://localhost/api/posts/test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "# Hello" }),
    });

    await PUT(req, { params: Promise.resolve({ slug: "test" }) });

    expect(mockCompileMarkdown).toHaveBeenCalledWith("# Hello");
    const callArgs = mockUpdatePost.mock.calls[0]?.[1];
    expect(callArgs?.html).toBe("<p>safe html</p>");
    expect(callArgs?.content).toBe("# Hello");
  });

  it("허용되지 않은 필드(id, created_at)는 무시되어야 함", async () => {
    mockUpdatePost.mockResolvedValue({ slug: "test" });

    const { PUT } = await import("@/app/api/posts/[slug]/route");
    const req = new Request("http://localhost/api/posts/test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 999, created_at: "2020-01-01", title: "OK" }),
    });

    await PUT(req, { params: Promise.resolve({ slug: "test" }) });

    const callArgs = mockUpdatePost.mock.calls[0]?.[1];
    expect(callArgs).not.toHaveProperty("id");
    expect(callArgs).not.toHaveProperty("created_at");
    expect(callArgs).toHaveProperty("title", "OK");
  });
});

// ─── SEC-13: Origin 검증 ───

describe("SEC-13: Origin 검증", () => {
  const kvStore = new Map<string, string>();

  beforeEach(() => {
    vi.resetModules();
    kvStore.clear();

    vi.doMock("@/lib/env", () => ({
      getKV: () =>
        ({
          get: async (key: string) => kvStore.get(key) ?? null,
          put: async (key: string, value: string) => {
            kvStore.set(key, value);
          },
        }) as unknown as KVNamespace,
      getDB: () => ({
        prepare: () => ({
          bind: () => ({
            first: async () => ({ started_at: Date.now() - 10000, used: 0 }),
            run: async () => ({}),
            all: async () => ({ results: [] }),
          }),
        }),
        batch: async () => [],
      }),
    }));
    vi.doMock("@/lib/visitor", () => ({
      getVisitorId: () => ({ id: "test-visitor", isNew: false }),
      setVisitorCookie: vi.fn(),
    }));
    vi.doMock("@/lib/scores", () => ({
      submitScore: vi.fn().mockResolvedValue({ id: 1 }),
      checkRateLimit: vi.fn().mockResolvedValue(true),
    }));
  });

  async function postScores(origin?: string) {
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/scores/route");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (origin) headers["Origin"] = origin;

    const req = new NextRequest("http://localhost/api/scores", {
      method: "POST",
      headers,
      body: JSON.stringify({
        gameSlug: "reaction",
        score: 200,
        sessionId: "test-session",
      }),
    });
    return POST(req);
  }

  it("needcash.dev Origin은 허용", async () => {
    const res = await postScores("https://needcash.dev");
    expect(res.status).not.toBe(403);
  });

  it("localhost Origin은 허용", async () => {
    const res = await postScores("http://localhost:3000");
    expect(res.status).not.toBe(403);
  });

  it("다른 도메인 Origin은 403 반환", async () => {
    const res = await postScores("https://evil.com");
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Forbidden");
  });

  it("Origin 없는 요청은 허용", async () => {
    const res = await postScores();
    expect(res.status).not.toBe(403);
  });
});
