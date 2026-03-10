import { describe, it, expect, beforeEach, vi } from "vitest";
import Database from "better-sqlite3";

// ─── In-memory better-sqlite3 → D1 호환 래퍼 ───
class TestD1Statement {
  private db: Database.Database;
  private sql: string;
  private params: unknown[] = [];

  constructor(db: Database.Database, sql: string) {
    this.db = db;
    this.sql = sql;
  }
  bind(...values: unknown[]) {
    this.params = values;
    return this;
  }
  async all<T>(): Promise<{ results: T[] }> {
    const results = this.db.prepare(this.sql).all(...this.params) as T[];
    return { results };
  }
  async first<T>(): Promise<T | null> {
    const result = this.db.prepare(this.sql).get(...this.params) as T | undefined;
    return (result as T) ?? null;
  }
  async run(): Promise<{ meta: { changes: number } }> {
    const info = this.db.prepare(this.sql).run(...this.params);
    return { meta: { changes: info.changes } };
  }
}

const testDb = new Database(":memory:");
testDb.pragma("journal_mode = WAL");
testDb.pragma("foreign_keys = ON");
testDb.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    updated_at TEXT,
    category TEXT NOT NULL DEFAULT 'etc',
    tags TEXT NOT NULL DEFAULT '[]',
    published INTEGER NOT NULL DEFAULT 1,
    reading_time INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    html TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const testD1 = {
  prepare: (sql: string) => new TestD1Statement(testDb, sql),
  batch: async () => ({ results: [] }),
  exec: (sql: string) => testDb.exec(sql),
  dump: async () => new ArrayBuffer(0),
};

vi.mock("../env", () => ({
  getDB: () => testD1,
}));

import {
  getAllPosts,
  getPostBySlug,
  getPostBySlugAdmin,
  createPost,
  updatePost,
  deletePost,
  getAllSlugs,
} from "../db";

// ─── Helper: 테스트 포스트 직접 삽입 ───
function insertTestPost(
  overrides: Partial<{
    slug: string;
    title: string;
    description: string;
    date: string;
    category: string;
    tags: string;
    published: number;
    reading_time: number;
    content: string;
    html: string;
  }> = {}
) {
  const defaults = {
    slug: `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: "Test Post",
    description: "Test description",
    date: "2026-01-01",
    category: "test",
    tags: '["test"]',
    published: 1,
    reading_time: 1,
    content: "# Test",
    html: "<h1>Test</h1>",
    ...overrides,
  };
  testDb
    .prepare(
      `INSERT INTO posts (slug,title,description,date,category,tags,published,reading_time,content,html)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      defaults.slug,
      defaults.title,
      defaults.description,
      defaults.date,
      defaults.category,
      defaults.tags,
      defaults.published,
      defaults.reading_time,
      defaults.content,
      defaults.html
    );
  return defaults;
}

// ─── 테스트 격리: 매 테스트 전 posts 초기화 ───
beforeEach(() => {
  testDb.prepare("DELETE FROM posts").run();
});

// ─── getAllPosts ───
describe("getAllPosts", () => {
  // LIB-DB-001: 발행 글만 반환
  it("published 글만 반환한다", async () => {
    insertTestPost({ slug: "pub-1", published: 1 });
    insertTestPost({ slug: "draft-1", published: 0 });
    insertTestPost({ slug: "pub-2", published: 1 });

    const posts = await getAllPosts();
    expect(posts).toHaveLength(2);
    expect(posts.map((p) => p.slug)).toContain("pub-1");
    expect(posts.map((p) => p.slug)).toContain("pub-2");
    expect(posts.map((p) => p.slug)).not.toContain("draft-1");
  });

  // LIB-DB-002: date DESC 정렬
  it("날짜 내림차순으로 정렬한다", async () => {
    insertTestPost({ slug: "old", date: "2025-01-01" });
    insertTestPost({ slug: "mid", date: "2025-06-15" });
    insertTestPost({ slug: "new", date: "2026-01-01" });

    const posts = await getAllPosts();
    expect(posts.map((p) => p.slug)).toEqual(["new", "mid", "old"]);
  });

  // LIB-DB-003: offset/limit
  it("offset과 limit을 적용한다", async () => {
    for (let i = 1; i <= 5; i++) {
      insertTestPost({ slug: `post-${i}`, date: `2026-01-0${i}` });
    }

    const posts = await getAllPosts(2, 2);
    expect(posts).toHaveLength(2);
    // date DESC: 05,04,03,02,01 → offset 2 → 03,02
    expect(posts[0].slug).toBe("post-3");
    expect(posts[1].slug).toBe("post-2");
  });
});

// ─── getPostBySlug ───
describe("getPostBySlug", () => {
  // LIB-DB-004: 존재하는 발행 글
  it("존재하는 발행 글을 반환한다", async () => {
    insertTestPost({ slug: "my-post", title: "My Post", content: "# Hello", html: "<h1>Hello</h1>" });

    const post = await getPostBySlug("my-post");
    expect(post).not.toBeNull();
    expect(post!.slug).toBe("my-post");
    expect(post!.title).toBe("My Post");
    expect(post!.content).toBe("# Hello");
    expect(post!.html).toBe("<h1>Hello</h1>");
    expect(post!.id).toBeTypeOf("number");
  });

  // LIB-DB-005: 미발행 글 → null
  it("미발행 글은 null을 반환한다", async () => {
    insertTestPost({ slug: "draft-post", published: 0 });

    const post = await getPostBySlug("draft-post");
    expect(post).toBeNull();
  });

  // LIB-DB-006: 미존재 slug → null
  it("존재하지 않는 slug는 null을 반환한다", async () => {
    const post = await getPostBySlug("non-existent");
    expect(post).toBeNull();
  });
});

// ─── getPostBySlugAdmin ───
describe("getPostBySlugAdmin", () => {
  // LIB-DB-007: 미발행 글도 반환
  it("미발행 글도 반환한다", async () => {
    insertTestPost({ slug: "admin-draft", published: 0, title: "Draft Title" });

    const post = await getPostBySlugAdmin("admin-draft");
    expect(post).not.toBeNull();
    expect(post!.slug).toBe("admin-draft");
    expect(post!.title).toBe("Draft Title");
    expect(post!.published).toBe(false);
  });
});

// ─── createPost ───
describe("createPost", () => {
  // LIB-DB-008: 정상 생성
  it("정상적으로 포스트를 생성한다", async () => {
    const post = await createPost({
      slug: "new-post",
      title: "New Post",
      description: "A new post",
      date: "2026-03-01",
      category: "dev",
      tags: ["typescript"],
      published: true,
      readingTime: 3,
      content: "# New Post",
      html: "<h1>New Post</h1>",
    });

    expect(post.id).toBeTypeOf("number");
    expect(post.slug).toBe("new-post");
    expect(post.title).toBe("New Post");
    expect(post.published).toBe(true);
    expect(post.readingTime).toBe(3);
  });

  // LIB-DB-009: tags JSON 직렬화
  it("tags를 JSON으로 직렬화한다", async () => {
    const post = await createPost({
      slug: "tag-post",
      title: "Tag Post",
      description: "desc",
      date: "2026-01-01",
      category: "test",
      tags: ["js", "react"],
      published: true,
      readingTime: 1,
      content: "c",
      html: "h",
    });

    expect(post.tags).toEqual(["js", "react"]);

    // DB에 JSON 문자열로 저장되었는지 확인
    const row = testDb
      .prepare("SELECT tags FROM posts WHERE slug = ?")
      .get("tag-post") as { tags: string };
    expect(row.tags).toBe('["js","react"]');
  });

  // LIB-DB-010: 중복 slug 에러
  it("중복 slug 삽입 시 에러를 발생시킨다", async () => {
    await createPost({
      slug: "dup-slug",
      title: "First",
      description: "d",
      date: "2026-01-01",
      category: "test",
      tags: [],
      published: true,
      readingTime: 1,
      content: "c",
      html: "h",
    });

    await expect(
      createPost({
        slug: "dup-slug",
        title: "Second",
        description: "d",
        date: "2026-01-01",
        category: "test",
        tags: [],
        published: true,
        readingTime: 1,
        content: "c",
        html: "h",
      })
    ).rejects.toThrow();
  });
});

// ─── updatePost ───
describe("updatePost", () => {
  // LIB-DB-011: 단일 필드 수정
  it("단일 필드를 수정한다", async () => {
    insertTestPost({ slug: "upd-single", title: "Old Title" });

    const updated = await updatePost("upd-single", { title: "New Title" });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("New Title");
    expect(updated!.description).toBe("Test description");
  });

  // LIB-DB-012: 다중 필드 수정
  it("다중 필드를 동시에 수정한다", async () => {
    insertTestPost({ slug: "upd-multi" });

    const updated = await updatePost("upd-multi", {
      title: "Updated Title",
      description: "Updated desc",
    });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Updated Title");
    expect(updated!.description).toBe("Updated desc");
  });

  // LIB-DB-013: tags JSON 직렬화
  it("tags를 JSON으로 직렬화하여 수정한다", async () => {
    insertTestPost({ slug: "upd-tags" });

    const updated = await updatePost("upd-tags", { tags: ["new", "tags"] });
    expect(updated).not.toBeNull();
    expect(updated!.tags).toEqual(["new", "tags"]);
  });

  // LIB-DB-014: published boolean→int 변환
  it("published boolean을 int로 변환하여 저장한다", async () => {
    insertTestPost({ slug: "upd-pub", published: 1 });

    const updated = await updatePost("upd-pub", { published: false });
    expect(updated).not.toBeNull();
    expect(updated!.published).toBe(false);

    // DB에 0으로 저장되었는지 확인
    const row = testDb
      .prepare("SELECT published FROM posts WHERE slug = ?")
      .get("upd-pub") as { published: number };
    expect(row.published).toBe(0);
  });

  // LIB-DB-015: 빈 data → 변경 없이 기존 글 반환
  it("빈 data 객체이면 변경 없이 기존 글을 반환한다", async () => {
    insertTestPost({ slug: "upd-empty", title: "Original" });

    const result = await updatePost("upd-empty", {});
    // updatePost with empty data calls getPostBySlug (published=1 only)
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Original");
  });

  // LIB-DB-016: 미존재 slug → null
  it("미존재 slug는 null을 반환한다", async () => {
    const result = await updatePost("non-existent", { title: "X" });
    expect(result).toBeNull();
  });

  // LIB-DB-017: updated_at 자동 설정
  it("수정 시 updated_at이 자동으로 오늘 날짜로 설정된다", async () => {
    insertTestPost({ slug: "upd-date" });

    const updated = await updatePost("upd-date", { title: "Changed" });
    expect(updated).not.toBeNull();
    expect(updated!.updatedAt).toBeDefined();

    const today = new Date().toISOString().split("T")[0];
    expect(updated!.updatedAt).toBe(today);
  });
});

// ─── deletePost ───
describe("deletePost", () => {
  // LIB-DB-018: 존재하는 글 삭제
  it("존재하는 글을 삭제하면 true를 반환한다", async () => {
    insertTestPost({ slug: "del-me" });

    const result = await deletePost("del-me");
    expect(result).toBe(true);

    // 삭제 확인
    const post = await getPostBySlugAdmin("del-me");
    expect(post).toBeNull();
  });

  // LIB-DB-019: 미존재 slug 삭제
  it("미존재 slug를 삭제하면 false를 반환한다", async () => {
    const result = await deletePost("non-existent");
    expect(result).toBe(false);
  });
});

// ─── getAllSlugs ───
describe("getAllSlugs", () => {
  // LIB-DB-020: 발행 글만 slug 반환
  it("발행 글의 slug만 반환한다", async () => {
    insertTestPost({ slug: "slug-pub-1", published: 1 });
    insertTestPost({ slug: "slug-draft", published: 0 });
    insertTestPost({ slug: "slug-pub-2", published: 1 });

    const slugs = await getAllSlugs();
    expect(slugs).toContain("slug-pub-1");
    expect(slugs).toContain("slug-pub-2");
    expect(slugs).not.toContain("slug-draft");
    expect(slugs).toHaveLength(2);
  });
});

// ─── rowToMeta 간접 검증 ───
describe("rowToMeta (간접 검증)", () => {
  // LIB-DB-021: tags JSON.parse
  it("tags를 JSON.parse하여 배열로 반환한다", async () => {
    insertTestPost({ slug: "meta-tags", tags: '["a","b"]' });

    const posts = await getAllPosts();
    const post = posts.find((p) => p.slug === "meta-tags");
    expect(post).toBeDefined();
    expect(post!.tags).toEqual(["a", "b"]);
    expect(Array.isArray(post!.tags)).toBe(true);
  });

  // LIB-DB-022: published 1→true 변환
  it("published 1을 true로 변환한다", async () => {
    insertTestPost({ slug: "meta-pub", published: 1 });

    const posts = await getAllPosts();
    const post = posts.find((p) => p.slug === "meta-pub");
    expect(post).toBeDefined();
    expect(post!.published).toBe(true);
  });
});
