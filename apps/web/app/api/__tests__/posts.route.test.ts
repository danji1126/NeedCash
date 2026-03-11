import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  getAllPosts: vi.fn(),
  createPost: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  verifyAdminAuth: vi.fn(),
  unauthorizedResponse: vi.fn(
    () =>
      Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      )
  ),
}));
vi.mock("@/lib/compile-markdown", () => ({
  compileMarkdown: vi.fn().mockResolvedValue("<p>compiled</p>"),
  calculateReadingTime: vi.fn().mockReturnValue(3),
}));
vi.mock("@/lib/admin-rate-limit", () => ({
  checkAdminRateLimit: vi.fn().mockResolvedValue(true),
}));

import { GET, POST } from "@/app/api/posts/route";
import { getAllPosts, createPost } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

const mockGetAllPosts = vi.mocked(getAllPosts);
const mockCreatePost = vi.mocked(createPost);
const mockVerifyAdminAuth = vi.mocked(verifyAdminAuth);

const samplePostMeta = {
  slug: "test-post",
  title: "Test Post",
  description: "A test",
  date: "2025-01-01",
  category: "dev",
  tags: ["test"],
  published: true,
  readingTime: 3,
};

describe("GET /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("정상 목록 반환 → 200, PostMeta[]", async () => {
    mockGetAllPosts.mockResolvedValue([samplePostMeta]);

    const req = new Request("http://localhost/api/posts");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([samplePostMeta]);
    expect(mockGetAllPosts).toHaveBeenCalledWith(0, 50);
  });

  it("offset/limit 파라미터 적용", async () => {
    mockGetAllPosts.mockResolvedValue([]);

    const req = new Request("http://localhost/api/posts?offset=10&limit=5");
    await GET(req);

    expect(mockGetAllPosts).toHaveBeenCalledWith(10, 5);
  });
});

describe("POST /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 + 유효한 body → 201", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    const createdPost = {
      id: 1,
      ...samplePostMeta,
      content: "# Hello",
      html: "<p>compiled</p>",
    };
    mockCreatePost.mockResolvedValue(createdPost);

    const req = new Request("http://localhost/api/posts", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Post",
        slug: "test-post",
        content: "# Hello",
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.slug).toBe("test-post");
    expect(mockCreatePost).toHaveBeenCalled();
  });

  it("인증 없음 → 401", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);

    const req = new Request("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: "T", slug: "t", content: "c" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("잘못된 slug 형식 → 400", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);

    const req = new Request("http://localhost/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test",
        slug: "INVALID SLUG!!",
        content: "content",
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("slug");
  });

  it("필수 필드 누락 → 400", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);

    const req = new Request("http://localhost/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("required");
  });
});
