# Design: blog-db-migration

> 블로그 시스템을 MDX 파일 기반에서 Cloudflare D1 데이터베이스 + Admin CMS로 전환하는 상세 기술 설계서

---

## 1. 아키텍처 개요

### 1.1 파일 구조

```
apps/web/
  # --- 신규 파일 ---
  cloudflare-env.d.ts                        # CloudflareEnv 타입 선언
  migrations/
    0001_create_posts.sql                     # D1 스키마

  lib/
    db.ts                                     # D1 쿼리 함수
    compile-markdown.ts                       # Markdown → HTML 컴파일 (Workers 호환)
    auth.ts                                   # Admin API Key 인증

  app/
    api/posts/
      route.ts                               # GET (목록), POST (생성)
    api/posts/[slug]/
      route.ts                               # GET (상세), PUT (수정), DELETE (삭제)

    admin/
      layout.tsx                             # Admin 레이아웃 (인증 컨텍스트)
      page.tsx                               # 로그인 페이지
      blog/
        page.tsx                             # 포스트 관리 대시보드
        new/
          page.tsx                           # 새 글 작성
        [id]/
          edit/
            page.tsx                         # 글 수정

  components/admin/
    auth-provider.tsx                        # 인증 상태 Context
    markdown-editor.tsx                      # Markdown 에디터 + 미리보기
    post-form.tsx                            # 메타데이터 입력 폼
    post-table.tsx                           # 포스트 목록 테이블

  # --- 수정 파일 ---
  wrangler.toml                              # D1 바인딩 추가
  open-next.config.ts                        # (변경 없음, 참고용)
  package.json                               # 의존성 변경
  lib/mdx.ts                                 # D1 쿼리 기반으로 전환
  app/blog/page.tsx                          # force-static 제거
  app/blog/[slug]/page.tsx                   # generateStaticParams 제거
  app/page.tsx                               # force-static 제거
  app/sitemap.ts                             # D1 조회 + admin 제외
  app/robots.ts                              # /admin Disallow 추가

  # --- 삭제 파일 ---
  scripts/generate-blog-data.mjs             # 빌드타임 생성 불필요
  lib/generated/blog-data.ts                 # D1로 대체
```

### 1.2 의존성 변경

```json
// 추가 (dependencies)
"rehype-highlight": "^7.0.2",    // Workers 호환 코드 하이라이팅

// 추가 (devDependencies → dependencies로 이동)
"unified": "^11.0.5",
"remark-parse": "^11.0.0",
"remark-gfm": "^4.0.1",
"remark-rehype": "^11.1.2",
"rehype-slug": "^6.0.0",
"rehype-raw": "^7.0.0",
"rehype-stringify": "^10.0.1",

// 제거 가능 (런타임 미사용, 마이그레이션 스크립트에서만 사용)
// rehype-pretty-code, shiki, next-mdx-remote → devDependencies로 이동 또는 제거
```

### 1.3 D1 접근 방식

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

// API Routes (non-static) - 동기 접근
const { env } = getCloudflareContext();
const db = env.DB;

// Server Components (동적 페이지) - 동기 접근
// force-static 제거 후 동적 렌더링이므로 동기 접근 가능
const { env } = getCloudflareContext();
const db = env.DB;
```

---

## 2. D1 스키마 설계

### 2.1 posts 테이블

```sql
-- migrations/0001_create_posts.sql

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
);

CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
```

### 2.2 wrangler.toml 변경

```toml
name = "needcash-hub"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"

routes = [
  { pattern = "needcash.dev/*", custom_domain = true }
]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "needcash-blog"
database_id = "<wrangler d1 create 후 생성되는 ID>"
```

### 2.3 타입 선언

```typescript
// cloudflare-env.d.ts
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    ASSETS: Fetcher;
    ADMIN_API_KEY: string;
  }
}
export {};
```

---

## 3. 데이터 접근 레이어 (lib/db.ts)

### 3.1 인터페이스

기존 `PostMeta` 인터페이스를 그대로 유지하여 블로그 컴포넌트 변경 최소화:

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

// 기존 lib/mdx.ts와 동일한 인터페이스 유지
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

// D1 row → PostMeta 변환
interface PostRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  date: string;
  updated_at: string | null;
  category: string;
  tags: string;          // JSON string
  published: number;     // 0 or 1
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
```

### 3.2 쿼리 함수

```typescript
function getDB(): D1Database {
  const { env } = getCloudflareContext();
  return env.DB;
}

// 게시된 포스트 목록 (메타데이터만)
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

// 단일 포스트 (slug 기반, content + html 포함)
export async function getPostBySlug(slug: string): Promise<PostFull | null> {
  const db = getDB();
  const row = await db
    .prepare(
      `SELECT * FROM posts WHERE slug = ? AND published = 1`
    )
    .bind(slug)
    .first<PostRow>();
  return row ? rowToFull(row) : null;
}

// 카테고리별 포스트
export async function getPostsByCategory(category: string): Promise<PostMeta[]> {
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

// 전체 포스트 (Admin용 - draft 포함)
export async function getAllPostsAdmin(): Promise<PostFull[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT * FROM posts ORDER BY date DESC`)
    .all<PostRow>();
  return results.map(rowToFull);
}

// 포스트 생성
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
  const result = await db
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
  return rowToFull(result!);
}

// 포스트 수정
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

  if (data.title !== undefined) { sets.push("title = ?"); values.push(data.title); }
  if (data.description !== undefined) { sets.push("description = ?"); values.push(data.description); }
  if (data.slug !== undefined) { sets.push("slug = ?"); values.push(data.slug); }
  if (data.date !== undefined) { sets.push("date = ?"); values.push(data.date); }
  if (data.category !== undefined) { sets.push("category = ?"); values.push(data.category); }
  if (data.tags !== undefined) { sets.push("tags = ?"); values.push(JSON.stringify(data.tags)); }
  if (data.published !== undefined) { sets.push("published = ?"); values.push(data.published ? 1 : 0); }
  if (data.readingTime !== undefined) { sets.push("reading_time = ?"); values.push(data.readingTime); }
  if (data.content !== undefined) { sets.push("content = ?"); values.push(data.content); }
  if (data.html !== undefined) { sets.push("html = ?"); values.push(data.html); }

  sets.push("updated_at = ?");
  values.push(new Date().toISOString().split("T")[0]);
  values.push(slug); // WHERE clause

  const row = await db
    .prepare(`UPDATE posts SET ${sets.join(", ")} WHERE slug = ? RETURNING *`)
    .bind(...values)
    .first<PostRow>();
  return row ? rowToFull(row) : null;
}

// 포스트 삭제
export async function deletePost(slug: string): Promise<boolean> {
  const db = getDB();
  const result = await db
    .prepare(`DELETE FROM posts WHERE slug = ?`)
    .bind(slug)
    .run();
  return result.meta.changes > 0;
}

// 모든 슬러그 (sitemap용)
export async function getAllSlugs(): Promise<string[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT slug FROM posts WHERE published = 1 ORDER BY date DESC`)
    .all<{ slug: string }>();
  return results.map((r) => r.slug);
}
```

---

## 4. Markdown 컴파일러 (lib/compile-markdown.ts)

Workers 런타임에서 실행 가능한 Markdown → HTML 컴파일 파이프라인.

### 4.1 구현

```typescript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify);

export async function compileMarkdown(markdown: string): Promise<string> {
  const result = await processor.process(markdown);
  return String(result);
}

export function calculateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
```

### 4.2 기존 코드 하이라이팅과의 호환

- 마이그레이션된 기존 글: `rehype-pretty-code`(shiki)로 컴파일된 HTML 유지
  - `<code>` 내 `<span style="color:...">` 인라인 스타일 사용
- Admin에서 생성한 신규 글: `rehype-highlight`(highlight.js) 사용
  - `<code class="hljs language-xxx"><span class="hljs-keyword">` 클래스 기반
- CSS에서 두 스타일 모두 지원:
  - shiki: 인라인 style로 동작하므로 추가 CSS 불필요
  - highlight.js: `highlight.js/styles/github-dark.css` import

---

## 5. 인증 (lib/auth.ts)

### 5.1 구현

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const { env } = getCloudflareContext();
  return token === env.ADMIN_API_KEY;
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}
```

### 5.2 API Key 설정

```bash
# 로컬 개발 (.dev.vars 파일)
ADMIN_API_KEY=dev-secret-key-change-me

# 프로덕션 (wrangler secret)
wrangler secret put ADMIN_API_KEY
```

---

## 6. API Routes 설계

### 6.1 GET/POST /api/posts (app/api/posts/route.ts)

```typescript
import { getAllPosts, createPost } from "@/lib/db";
import { compileMarkdown, calculateReadingTime } from "@/lib/compile-markdown";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

// GET: 게시된 포스트 목록
export async function GET() {
  const posts = await getAllPosts();
  return Response.json(posts);
}

// POST: 새 포스트 생성 (인증 필요)
export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const body = await request.json();
  const { title, slug, description, date, category, tags, content, published } = body;

  // 유효성 검사
  if (!title || !slug || !content) {
    return Response.json({ error: "title, slug, content are required" }, { status: 400 });
  }

  // Markdown → HTML 컴파일
  const html = await compileMarkdown(content);
  const readingTime = calculateReadingTime(content);

  const post = await createPost({
    slug,
    title,
    description: description ?? "",
    date: date ?? new Date().toISOString().split("T")[0],
    category: category ?? "etc",
    tags: tags ?? [],
    published: published ?? true,
    readingTime,
    content,
    html,
  });

  return Response.json(post, { status: 201 });
}
```

### 6.2 GET/PUT/DELETE /api/posts/[slug] (app/api/posts/[slug]/route.ts)

```typescript
import { getPostBySlug, updatePost, deletePost } from "@/lib/db";
import { compileMarkdown, calculateReadingTime } from "@/lib/compile-markdown";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

interface Params {
  params: Promise<{ slug: string }>;
}

// GET: 단일 포스트
export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(post);
}

// PUT: 포스트 수정 (인증 필요)
export async function PUT(request: Request, { params }: Params) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const { slug } = await params;
  const body = await request.json();

  // content가 변경되었으면 HTML 재컴파일
  const updates: Record<string, unknown> = { ...body };
  if (body.content) {
    updates.html = await compileMarkdown(body.content);
    updates.readingTime = calculateReadingTime(body.content);
  }
  if (body.tags && Array.isArray(body.tags)) {
    updates.tags = body.tags;
  }

  const post = await updatePost(slug, updates);
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(post);
}

// DELETE: 포스트 삭제 (인증 필요)
export async function DELETE(request: Request, { params }: Params) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const { slug } = await params;
  const deleted = await deletePost(slug);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
```

---

## 7. 기존 블로그 페이지 수정

### 7.1 lib/mdx.ts 전환

기존 파일을 D1 기반으로 교체. 인터페이스를 유지하되 내부 구현만 변경:

```typescript
// lib/mdx.ts - D1 기반 전환

// 기존 인터페이스 re-export (db.ts에서 정의)
export type { PostMeta } from "./db";
export { getAllPosts, getPostBySlug } from "./db";

// Heading 추출은 기존 로직 유지 (raw markdown에서 regex)
export interface Heading {
  level: number;
  text: string;
  id: string;
}

const HEADING_REGEX = /^(#{2,3})\s+(.+)$/gm;

export function extractHeadings(content: string): Heading[] {
  HEADING_REGEX.lastIndex = 0;
  const headings: Heading[] = [];
  let match;
  while ((match = HEADING_REGEX.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/\s+/g, "-"),
    });
  }
  return headings;
}
```

### 7.2 app/blog/page.tsx 수정

```diff
- import { getAllPosts } from "@/lib/mdx";
+ import { getAllPosts } from "@/lib/mdx";  // 동일 import, 내부 구현만 변경

- export const dynamic = "force-static";
  // force-static 제거 → 매 요청마다 D1 조회

- export default function BlogPage() {
-   const posts = getAllPosts();
+ export default async function BlogPage() {
+   const posts = await getAllPosts();  // async 추가 (D1 비동기 쿼리)
```

### 7.3 app/blog/[slug]/page.tsx 수정

```diff
- export async function generateStaticParams() {
-   return getAllPosts().map((post) => ({ slug: post.slug }));
- }
  // generateStaticParams 제거 → 동적 렌더링

  export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
-   const post = getPostBySlug(slug);
+   const post = await getPostBySlug(slug);  // await 추가

  export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
-   const post = getPostBySlug(slug);
+   const post = await getPostBySlug(slug);  // await 추가
```

### 7.4 app/page.tsx 수정

```diff
- export const dynamic = "force-static";
  // force-static 제거

- export default function Home() {
-   const recentPosts = getAllPosts().slice(0, 3);
+ export default async function Home() {
+   const recentPosts = (await getAllPosts()).slice(0, 3);
```

### 7.5 app/sitemap.ts 수정

```diff
- import { getAllPosts } from "@/lib/mdx";
+ import { getAllSlugs } from "@/lib/db";

- export const dynamic = "force-static";
  // force-static 제거

- export default function sitemap(): MetadataRoute.Sitemap {
+ export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

-   const blogPages = getAllPosts().map((post) => ({
-     url: `${baseUrl}/blog/${post.slug}`,
-     lastModified: new Date(post.date),
+   const slugs = await getAllSlugs();
+   const blogPages = slugs.map((slug) => ({
+     url: `${baseUrl}/blog/${slug}`,
+     lastModified: new Date(),
```

### 7.6 app/robots.ts 수정

```diff
  export default function robots(): MetadataRoute.Robots {
    return {
-     rules: {
-       userAgent: "*",
-       allow: "/",
-     },
+     rules: [
+       {
+         userAgent: "*",
+         allow: "/",
+         disallow: "/admin",
+       },
+     ],
      sitemap: `${SITE.url}/sitemap.xml`,
    };
  }
```

### 7.7 components/blog/related-posts.tsx 수정

```diff
- import { getAllPosts } from "@/lib/mdx";
+ import { getAllPosts } from "@/lib/mdx";

- export function RelatedPosts({ currentSlug, category }: RelatedPostsProps) {
-   const allPosts = getAllPosts().filter((p) => p.slug !== currentSlug);
+ export async function RelatedPosts({ currentSlug, category }: RelatedPostsProps) {
+   const allPosts = (await getAllPosts()).filter((p) => p.slug !== currentSlug);
```

---

## 8. Admin 페이지 설계

### 8.1 인증 Context (components/admin/auth-provider.tsx)

```typescript
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AuthContextType {
  apiKey: string | null;
  isAuthenticated: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_api_key");
  });

  const login = useCallback(async (key: string): Promise<boolean> => {
    // API Key 검증 - 실제 API 호출로 확인
    const res = await fetch("/api/posts", {
      headers: { Authorization: `Bearer ${key}` },
    });
    // GET /api/posts는 인증 불필요이므로 별도 검증 엔드포인트 또는
    // Admin 전용 엔드포인트로 확인
    // 간단하게: 임의 POST 시도 대신, 별도 /api/auth/verify 엔드포인트 사용
    const verifyRes = await fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (verifyRes.ok) {
      setApiKey(key);
      localStorage.setItem("admin_api_key", key);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setApiKey(null);
    localStorage.removeItem("admin_api_key");
  }, []);

  return (
    <AuthContext.Provider value={{ apiKey, isAuthenticated: !!apiKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
```

### 8.2 인증 검증 API (app/api/auth/verify/route.ts)

```typescript
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();
  return Response.json({ ok: true });
}
```

### 8.3 Admin 레이아웃 (app/admin/layout.tsx)

```typescript
import { AuthProvider } from "@/components/admin/auth-provider";

export const metadata = {
  robots: { index: false, follow: false }, // 검색 엔진 차단
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg">
        <header className="border-b border-border/60 px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <h1 className="font-heading text-lg font-bold">NeedCash Admin</h1>
            {/* logout 버튼은 auth-provider의 useAuth에서 */}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
```

### 8.4 로그인 페이지 (app/admin/page.tsx)

```
"use client" 컴포넌트
- API Key 입력 필드 (password type)
- 로그인 버튼 → useAuth().login(key)
- 성공 시 /admin/blog로 리다이렉트
- 실패 시 에러 메시지 표시
- 이미 인증된 경우 /admin/blog로 자동 리다이렉트
```

### 8.5 포스트 관리 대시보드 (app/admin/blog/page.tsx)

```
"use client" 컴포넌트
- 인증 확인 → 미인증 시 /admin으로 리다이렉트
- 전체 포스트 목록 테이블 (PostTable 컴포넌트)
  - 컬럼: title, slug, category, published(badge), date, actions
  - 액션: 수정(edit), 삭제(delete with confirm)
- "새 글 작성" 버튼 → /admin/blog/new
- published / draft 필터 탭
- 삭제 시 confirm 다이얼로그
```

### 8.6 Markdown 에디터 (components/admin/markdown-editor.tsx)

```
"use client" 컴포넌트
- 좌우 분할 레이아웃 (리사이즈 가능)
- 왼쪽: textarea (monospace font, 라인 넘버 옵션)
- 오른쪽: HTML 미리보기 (prose-custom 스타일 적용)
- 미리보기: 클라이언트에서 간이 Markdown 렌더링
  - 옵션 A: marked.js (경량 클라이언트 Markdown 파서)
  - 옵션 B: API 호출로 서버 컴파일 결과 미리보기
  → 옵션 A 채택 (실시간 미리보기 위해)
- Markdown 툴바: bold, italic, heading, link, image, code, list
  - 선택 텍스트 래핑 방식 (커서 위치 유지)
- 자동 resize (textarea 높이 자동 조절)
```

### 8.7 메타데이터 입력 폼 (components/admin/post-form.tsx)

```
"use client" 컴포넌트
필드:
- title (text input, required)
- slug (text input, title에서 자동 생성, 수동 편집 가능)
  - 자동 생성 로직: title → lowercase → 공백을 하이픈으로 → 특수문자 제거
- description (textarea, 2줄)
- date (date input, 기본값 오늘)
- category (select 또는 text input with datalist)
  - 기존 카테고리 목록 자동 완성
- tags (comma-separated input → 배열 변환)
  - 태그 chip UI (추가/삭제)
- published (토글 스위치)

레이아웃: 상단에 메타데이터 폼, 하단에 Markdown 에디터
저장 버튼: "게시" (published=true), "초안 저장" (published=false)
```

### 8.8 새 글 작성 / 수정 페이지

**새 글 작성** (app/admin/blog/new/page.tsx):
```
"use client"
- PostForm + MarkdownEditor 조합
- 저장 → POST /api/posts
- 성공 시 /admin/blog로 리다이렉트
```

**글 수정** (app/admin/blog/[id]/edit/page.tsx):
```
"use client"
- URL의 id로 포스트 조회 (GET /api/posts/[slug])
- PostForm + MarkdownEditor에 기존 데이터 채움
- 저장 → PUT /api/posts/[slug]
- 성공 시 /admin/blog로 리다이렉트
```

---

## 9. 마이그레이션 스크립트 (scripts/migrate-blog-to-d1.mjs)

### 9.1 동작 흐름

```
1. content/blog/*.mdx 파일 목록 스캔
2. 각 파일:
   a. gray-matter로 frontmatter 파싱
   b. unified + rehype-pretty-code로 HTML 컴파일 (기존 파이프라인)
   c. reading_time 계산
3. wrangler d1 execute로 INSERT
   - 방법 A: SQL 파일 생성 후 wrangler d1 execute --file
   - 방법 B: Wrangler D1 REST API 사용
   → 방법 A 채택 (간단, 로컬/리모트 동일)
4. 검증: SELECT COUNT(*) 확인
```

### 9.2 출력

```sql
-- generated: migrate-data.sql
INSERT INTO posts (slug, title, description, date, updated_at, category, tags, published, reading_time, content, html)
VALUES ('hello-world', 'Hello World', '...', '2024-01-01', NULL, 'dev', '["blog","intro"]', 1, 2, '...content...', '...html...');
-- ... 10개 반복
```

실행:
```bash
node scripts/migrate-blog-to-d1.mjs > migrations/0002_seed_data.sql
wrangler d1 migrations apply needcash-blog --local   # 로컬 테스트
wrangler d1 migrations apply needcash-blog --remote  # 프로덕션 적용
```

---

## 10. 스타일링

### 10.1 highlight.js CSS

Admin에서 생성한 글의 코드 하이라이팅을 위해 highlight.js 테마 CSS 추가:

```typescript
// app/layout.tsx 또는 globals.css에 추가
// 방법 1: CDN (간단)
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />

// 방법 2: npm 패키지 import (번들 포함, 권장)
// globals.css에 @import "highlight.js/styles/github-dark.css";
```

### 10.2 기존 prose-custom 스타일

기존 `prose-custom` 클래스는 shiki 인라인 스타일과 호환됨.
highlight.js 클래스 기반 스타일도 동일한 `prose-custom` 내에서 동작하도록 CSS 확인:

```css
/* shiki 스타일 (기존 글) - 인라인 style로 동작, 추가 CSS 불필요 */

/* highlight.js 스타일 (신규 글) */
.prose-custom pre code.hljs {
  padding: 0;
  background: transparent;
}
```

---

## 11. 구현 순서 상세

| Phase | 작업 | 의존성 |
|-------|------|--------|
| **1. D1 설정** | wrangler d1 create, wrangler.toml, cloudflare-env.d.ts, migrations SQL | 없음 |
| **2. 마이그레이션** | migrate-blog-to-d1.mjs, SQL seed 실행, 데이터 검증 | Phase 1 |
| **3. 데이터 레이어** | lib/db.ts, lib/mdx.ts 수정, 블로그 페이지 async 전환 | Phase 2 |
| **4. API Routes** | lib/compile-markdown.ts, lib/auth.ts, /api/posts, /api/auth/verify | Phase 3 |
| **5. Admin 페이지** | auth-provider, 로그인, 대시보드, 에디터, 폼 | Phase 4 |
| **6. 정리 + 테스트** | 빌드 스크립트 제거, deps 정리, robots/sitemap 수정, E2E 테스트 | Phase 5 |

---

## 12. 검증 체크리스트

### Public

- [ ] `/blog` → D1에서 포스트 목록 조회, 카테고리/태그 필터 동작
- [ ] `/blog/[slug]` → 개별 포스트 HTML 렌더링, TOC, 관련 글
- [ ] `/` → 홈 최근 포스트 3개 표시
- [ ] `/sitemap.xml` → 블로그 URL 포함, admin 제외
- [ ] `/robots.txt` → `/admin` Disallow
- [ ] OG 메타데이터, JSON-LD 정상

### Admin

- [ ] `/admin` → 로그인 (올바른 키 / 잘못된 키)
- [ ] `/admin/blog` → 전체 포스트 목록 (published/draft 구분)
- [ ] `/admin/blog/new` → Markdown 작성 + 미리보기 + 저장
- [ ] 저장된 글이 `/blog`에 즉시 반영
- [ ] `/admin/blog/[id]/edit` → 기존 글 수정 + HTML 재컴파일
- [ ] 포스트 삭제 → `/blog`에서 제거
- [ ] 인증 없이 POST/PUT/DELETE → 401

### API

- [ ] GET `/api/posts` → 200 + 게시된 포스트 배열
- [ ] GET `/api/posts/[slug]` → 200 + 단일 포스트
- [ ] POST `/api/posts` (인증) → 201 + 생성된 포스트
- [ ] PUT `/api/posts/[slug]` (인증) → 200 + 수정된 포스트
- [ ] DELETE `/api/posts/[slug]` (인증) → 200
- [ ] 인증 없이 write 요청 → 401
