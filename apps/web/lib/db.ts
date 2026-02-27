export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  published: boolean;
  readingTime: number;
}

export interface PostFull extends PostMeta {
  id: number;
  content: string;
  html: string;
}

interface PostRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  date: string;
  updated_at: string | null;
  category: string;
  tags: string;
  published: number;
  reading_time: number;
  content: string;
  html: string;
  created_at: string;
}

function rowToMeta(row: PostRow): PostMeta {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.date,
    updatedAt: row.updated_at ?? undefined,
    category: row.category,
    tags: JSON.parse(row.tags),
    published: row.published === 1,
    readingTime: row.reading_time,
  };
}

function rowToFull(row: PostRow): PostFull {
  return {
    ...rowToMeta(row),
    id: row.id,
    content: row.content,
    html: row.html,
  };
}

function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT id, slug, title, description, date, updated_at, category, tags,
              published, reading_time, created_at
       FROM posts
       WHERE published = 1
       ORDER BY date DESC`
    )
    .all<PostRow>();
  return results.map(rowToMeta);
}

export async function getPostBySlug(slug: string): Promise<PostFull | null> {
  const db = getDB();
  const row = await db
    .prepare(`SELECT * FROM posts WHERE slug = ? AND published = 1`)
    .bind(slug)
    .first<PostRow>();
  return row ? rowToFull(row) : null;
}

export async function getPostsByCategory(
  category: string
): Promise<PostMeta[]> {
  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT id, slug, title, description, date, updated_at, category, tags,
              published, reading_time, created_at
       FROM posts
       WHERE published = 1 AND category = ?
       ORDER BY date DESC`
    )
    .bind(category)
    .all<PostRow>();
  return results.map(rowToMeta);
}

export async function getAllPostsAdmin(): Promise<PostFull[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT * FROM posts ORDER BY date DESC`)
    .all<PostRow>();
  return results.map(rowToFull);
}

export async function createPost(data: {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  published: boolean;
  readingTime: number;
  content: string;
  html: string;
}): Promise<PostFull> {
  const db = getDB();
  const row = await db
    .prepare(
      `INSERT INTO posts (slug, title, description, date, category, tags, published, reading_time, content, html)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    )
    .bind(
      data.slug,
      data.title,
      data.description,
      data.date,
      data.category,
      JSON.stringify(data.tags),
      data.published ? 1 : 0,
      data.readingTime,
      data.content,
      data.html
    )
    .first<PostRow>();
  return rowToFull(row!);
}

export async function updatePost(
  slug: string,
  data: Partial<{
    title: string;
    description: string;
    slug: string;
    date: string;
    category: string;
    tags: string[];
    published: boolean;
    readingTime: number;
    content: string;
    html: string;
  }>
): Promise<PostFull | null> {
  const db = getDB();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    sets.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    sets.push("description = ?");
    values.push(data.description);
  }
  if (data.slug !== undefined) {
    sets.push("slug = ?");
    values.push(data.slug);
  }
  if (data.date !== undefined) {
    sets.push("date = ?");
    values.push(data.date);
  }
  if (data.category !== undefined) {
    sets.push("category = ?");
    values.push(data.category);
  }
  if (data.tags !== undefined) {
    sets.push("tags = ?");
    values.push(JSON.stringify(data.tags));
  }
  if (data.published !== undefined) {
    sets.push("published = ?");
    values.push(data.published ? 1 : 0);
  }
  if (data.readingTime !== undefined) {
    sets.push("reading_time = ?");
    values.push(data.readingTime);
  }
  if (data.content !== undefined) {
    sets.push("content = ?");
    values.push(data.content);
  }
  if (data.html !== undefined) {
    sets.push("html = ?");
    values.push(data.html);
  }

  if (sets.length === 0) return getPostBySlug(slug);

  sets.push("updated_at = ?");
  values.push(new Date().toISOString().split("T")[0]);
  values.push(slug);

  const row = await db
    .prepare(`UPDATE posts SET ${sets.join(", ")} WHERE slug = ? RETURNING *`)
    .bind(...values)
    .first<PostRow>();
  return row ? rowToFull(row) : null;
}

export async function deletePost(slug: string): Promise<boolean> {
  const db = getDB();
  const result = await db
    .prepare(`DELETE FROM posts WHERE slug = ?`)
    .bind(slug)
    .run();
  return result.meta.changes > 0;
}

export async function getAllSlugs(): Promise<string[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT slug FROM posts WHERE published = 1 ORDER BY date DESC`)
    .all<{ slug: string }>();
  return results.map((r) => r.slug);
}
