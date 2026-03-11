import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  getPostBySlug: vi.fn(),
  getPostBySlugAdmin: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
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

import { GET, PUT, DELETE } from "@/app/api/posts/[slug]/route";
import {
  getPostBySlug,
  getPostBySlugAdmin,
  updatePost,
  deletePost,
} from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";
import { compileMarkdown } from "@/lib/compile-markdown";

const mockGetPostBySlug = vi.mocked(getPostBySlug);
const mockGetPostBySlugAdmin = vi.mocked(getPostBySlugAdmin);
const mockUpdatePost = vi.mocked(updatePost);
const mockDeletePost = vi.mocked(deletePost);
const mockVerifyAdminAuth = vi.mocked(verifyAdminAuth);
const mockCompileMarkdown = vi.mocked(compileMarkdown);

const samplePost = {
  id: 1,
  slug: "test-post",
  title: "Test Post",
  description: "A test",
  date: "2025-01-01",
  category: "dev",
  tags: ["test"],
  published: true,
  readingTime: 3,
  content: "# Hello",
  html: "<h1>Hello</h1>",
};

const makeParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("GET /api/posts/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("공개된 글 → 200", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);
    mockGetPostBySlug.mockResolvedValue(samplePost);

    const req = new Request("http://localhost/api/posts/test-post");
    const res = await GET(req, makeParams("test-post"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.slug).toBe("test-post");
    expect(mockGetPostBySlug).toHaveBeenCalledWith("test-post");
  });

  it("비공개 글 (인증 없음) → 404", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);
    mockGetPostBySlug.mockResolvedValue(null);

    const req = new Request("http://localhost/api/posts/draft-post");
    const res = await GET(req, makeParams("draft-post"));

    expect(res.status).toBe(404);
  });

  it("비공개 글 (관리자 인증) → 200", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    mockGetPostBySlugAdmin.mockResolvedValue({
      ...samplePost,
      slug: "draft-post",
      published: false,
    });

    const req = new Request("http://localhost/api/posts/draft-post", {
      headers: { Authorization: "Bearer admin-key" },
    });
    const res = await GET(req, makeParams("draft-post"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.slug).toBe("draft-post");
    expect(mockGetPostBySlugAdmin).toHaveBeenCalledWith("draft-post");
  });
});

describe("PUT /api/posts/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 + body → 200, 수정된 포스트", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    mockUpdatePost.mockResolvedValue({ ...samplePost, title: "Updated" });

    const req = new Request("http://localhost/api/posts/test-post", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PUT(req, makeParams("test-post"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe("Updated");
  });

  it("content 변경 시 compileMarkdown 호출", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    mockUpdatePost.mockResolvedValue({
      ...samplePost,
      content: "new content",
      html: "<p>compiled</p>",
    });

    const req = new Request("http://localhost/api/posts/test-post", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "new content" }),
    });
    await PUT(req, makeParams("test-post"));

    expect(mockCompileMarkdown).toHaveBeenCalledWith("new content");
  });
});

describe("DELETE /api/posts/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 + 존재하는 글 → 200", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    mockDeletePost.mockResolvedValue(true);

    const req = new Request("http://localhost/api/posts/test-post", {
      method: "DELETE",
      headers: { Authorization: "Bearer admin-key" },
    });
    const res = await DELETE(req, makeParams("test-post"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it("존재하지 않는 글 → 404", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    mockDeletePost.mockResolvedValue(false);

    const req = new Request("http://localhost/api/posts/nonexistent", {
      method: "DELETE",
      headers: { Authorization: "Bearer admin-key" },
    });
    const res = await DELETE(req, makeParams("nonexistent"));

    expect(res.status).toBe(404);
  });
});
