import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  getAllPostsAdminList: vi.fn(),
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

import { GET } from "@/app/api/posts/admin/route";
import { getAllPostsAdminList } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

const mockGetAllPostsAdminList = vi.mocked(getAllPostsAdminList);
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

describe("GET /api/posts/admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증됨 → 200, 전체 포스트 목록", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    mockGetAllPostsAdminList.mockResolvedValue([
      samplePostMeta,
      { ...samplePostMeta, slug: "draft", published: false },
    ]);

    const req = new Request("http://localhost/api/posts/admin", {
      headers: { Authorization: "Bearer admin-key" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
  });

  it("인증 없음 → 401", async () => {
    mockVerifyAdminAuth.mockResolvedValue(false);

    const req = new Request("http://localhost/api/posts/admin");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("빈 목록 → 200, []", async () => {
    mockVerifyAdminAuth.mockResolvedValue(true);
    mockGetAllPostsAdminList.mockResolvedValue([]);

    const req = new Request("http://localhost/api/posts/admin", {
      headers: { Authorization: "Bearer admin-key" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });
});
