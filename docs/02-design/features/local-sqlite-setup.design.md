# Design: local-sqlite-setup

> **Feature**: local-sqlite-setup (로컬 SQLite 개발 환경 구축)
> **작성일**: 2026-02-27
> **Plan 참조**: `docs/01-plan/features/local-sqlite-setup.plan.md`
> **요구사항**: FR-01 ~ FR-08, NFR-01 ~ NFR-04

---

## 1. 아키텍처 설계

### 전체 흐름

```
┌──────────────────────────────────────────────────────────┐
│ app/ (페이지, API 라우트) — 변경 없음                      │
│   getAllPosts(), getPostBySlug(), createPost(), ...       │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│ lib/db.ts → getDB(): D1Database                          │
│                                                          │
│   process.env.USE_LOCAL_DB === "true"                     │
│   ┌─────────┐          ┌─────────┐                       │
│   │  true    │          │ false   │                       │
│   └────┬────┘          └────┬────┘                       │
│        ▼                    ▼                             │
│   lib/local-db.ts     @opennextjs/cloudflare             │
│   (better-sqlite3)    (getCloudflareContext)              │
│   → D1 호환 래퍼      → env.DB (D1Database)              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ lib/auth.ts → verifyAdminAuth(): boolean                 │
│                                                          │
│   process.env.USE_LOCAL_DB === "true"                     │
│   ┌─────────┐          ┌─────────┐                       │
│   │  true    │          │ false   │                       │
│   └────┬────┘          └────┬────┘                       │
│        ▼                    ▼                             │
│   process.env             @opennextjs/cloudflare         │
│   .ADMIN_API_KEY          env.ADMIN_API_KEY              │
└──────────────────────────────────────────────────────────┘
```

### 환경 감지 방식: 환경변수 (`USE_LOCAL_DB`)

try-catch 대신 환경변수 방식을 채택:
- 명시적: 의도하지 않은 fallback 방지
- 디버깅 용이: 어떤 DB를 쓰는지 명확
- Next.js 호환: `.env.local`에서 자동 로드

---

## 2. 파일별 상세 설계

### 2.1 신규: `lib/local-db.ts`

D1Database 인터페이스 호환 래퍼. `db.ts`에서 사용하는 D1 API만 구현.

**사용되는 D1 API 목록** (db.ts 분석 결과):

| 메서드 | 사용처 | 설명 |
|--------|--------|------|
| `db.prepare(sql)` | 모든 함수 | SQL문 준비 |
| `.bind(...values)` | getPostBySlug, getPostsByCategory, createPost, updatePost, deletePost | 파라미터 바인딩 |
| `.all<T>()` | getAllPosts, getPostsByCategory, getAllPostsAdmin, getAllSlugs | 복수 행 조회 → `{ results: T[] }` |
| `.first<T>()` | getPostBySlug, createPost, updatePost | 단일 행 조회 → `T \| null` |
| `.run()` | deletePost | 실행 → `{ meta: { changes: number } }` |

**구현 코드:**

```typescript
// lib/local-db.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "local.sqlite");

class LocalD1PreparedStatement {
  private db: Database.Database;
  private sql: string;
  private params: unknown[] = [];

  constructor(db: Database.Database, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  bind(...values: unknown[]): this {
    this.params = values;
    return this;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const stmt = this.db.prepare(this.sql);
    const results = stmt.all(...this.params) as T[];
    return { results };
  }

  async first<T>(): Promise<T | null> {
    const stmt = this.db.prepare(this.sql);
    const result = stmt.get(...this.params) as T | undefined;
    return (result as T) ?? null;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const stmt = this.db.prepare(this.sql);
    const info = stmt.run(...this.params);
    return { meta: { changes: info.changes } };
  }
}

class LocalD1Database {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  prepare(sql: string): LocalD1PreparedStatement {
    return new LocalD1PreparedStatement(this.db, sql);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }
}

// 싱글턴
let instance: LocalD1Database | null = null;

export function getLocalDB(): LocalD1Database {
  if (!instance) {
    instance = new LocalD1Database(DB_PATH);
    runMigrations(instance);
  }
  return instance;
}

function runMigrations(db: LocalD1Database): void {
  const migrationsDir = path.join(process.cwd(), "migrations");

  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    try {
      db.exec(sql);
    } catch {
      // 이미 존재하는 테이블/데이터는 무시 (CREATE IF NOT EXISTS, UNIQUE 충돌)
    }
  }
}
```

**설계 결정:**

| 항목 | 결정 | 이유 |
|------|------|------|
| DB 파일 경로 | `data/local.sqlite` | 프로젝트 내 명확한 위치, `.wrangler/` 와 충돌 방지 |
| 싱글턴 | `let instance` | HMR 재로드 시에도 한 번만 초기화 |
| 마이그레이션 | 자동 실행 | NFR-04 충족 (별도 셋업 불필요) |
| WAL 모드 | 활성화 | 동시 읽기 성능 향상, D1 기본값과 동일 |
| 에러 처리 | try-catch 무시 | `CREATE IF NOT EXISTS`, `UNIQUE` 충돌 안전 처리 |

### 2.2 수정: `lib/db.ts`

**변경 범위:** import 문 1줄 + `getDB()` 함수 본문 (5줄 → 10줄)

**변경 전:**
```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";
// ... (타입, 변환 함수는 변경 없음)

function getDB(): D1Database {
  const { env } = getCloudflareContext();
  return env.DB;
}
```

**변경 후:**
```typescript
// 조건부 import 제거 → 동적 require로 변경

// ... (타입, 변환 함수는 변경 없음)

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
```

**동적 require 사용 이유:**
- `local-db.ts`는 `better-sqlite3` (Node.js 네이티브)를 import
- Workers 빌드 시 번들에 포함되면 에러 발생
- `require()`는 런타임에만 평가 → 조건 미충족 시 로드하지 않음
- top-level `import`는 빌드 시 항상 번들에 포함

### 2.3 수정: `lib/auth.ts`

**변경 범위:** import 문 제거 + `verifyAdminAuth()` 본문

**변경 전:**
```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const { env } = getCloudflareContext();
  return token === env.ADMIN_API_KEY;
}
```

**변경 후:**
```typescript
export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);

  if (process.env.USE_LOCAL_DB === "true") {
    return token === (process.env.ADMIN_API_KEY ?? "dev-secret-key");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return token === env.ADMIN_API_KEY;
}
```

### 2.4 신규: `.env.local`

```env
USE_LOCAL_DB=true
ADMIN_API_KEY=dev-secret-key
```

- Next.js가 자동 로드 (`.env.local`은 git에 포함하지 않음)
- `USE_LOCAL_DB=true`: 로컬 SQLite 모드 활성화
- `ADMIN_API_KEY`: Admin 인증 토큰

### 2.5 수정: `package.json`

**devDependencies 추가:**
```json
{
  "devDependencies": {
    "better-sqlite3": "^11.0.0",
    "@types/better-sqlite3": "^7.6.0"
  }
}
```

**scripts 추가:**
```json
{
  "scripts": {
    "db:reset": "rm -rf data/local.sqlite data/local.sqlite-wal data/local.sqlite-shm"
  }
}
```

- `db:reset`: SQLite 파일 삭제 → 다음 `pnpm dev`에서 자동 재생성
- `dev:local`은 불필요: `.env.local`에서 `USE_LOCAL_DB=true` 자동 로드

### 2.6 수정: `.gitignore`

```gitignore
# Local SQLite (dev only)
data/local.sqlite
data/local.sqlite-wal
data/local.sqlite-shm
```

---

## 3. D1 API 호환성 매핑

### 메서드 매핑

| D1 API | better-sqlite3 API | 비고 |
|--------|-------------------|------|
| `db.prepare(sql)` | `db.prepare(sql)` | 동일 |
| `stmt.bind(...values)` | `stmt.run/get/all(...values)` | D1은 체이닝, bs3는 실행 시 전달 |
| `stmt.all<T>()` → `{ results: T[] }` | `stmt.all(...params)` → `T[]` | 래퍼에서 `{ results }` 래핑 |
| `stmt.first<T>()` → `T \| null` | `stmt.get(...params)` → `T \| undefined` | 래퍼에서 `undefined → null` 변환 |
| `stmt.run()` → `{ meta: { changes } }` | `stmt.run(...params)` → `{ changes }` | 래퍼에서 `{ meta: { changes } }` 래핑 |

### RETURNING 절 호환

```sql
-- db.ts에서 사용되는 RETURNING 쿼리 (2곳)
INSERT INTO posts (...) VALUES (...) RETURNING *    -- createPost()
UPDATE posts SET ... WHERE slug = ? RETURNING *     -- updatePost()
```

- `better-sqlite3` v11+는 SQLite 3.45+ 번들 → `RETURNING` 네이티브 지원
- 래퍼에서 `RETURNING` 포함 쿼리도 `stmt.get()`으로 처리 (단일 행 반환)
- `first<T>()` 메서드가 이미 `stmt.get()` 사용하므로 추가 처리 불필요

---

## 4. 시드 데이터 처리

### 마이그레이션 실행 순서

```
1. 0001_create_posts.sql → CREATE TABLE IF NOT EXISTS + CREATE INDEX
2. 0002_seed_data.sql    → INSERT INTO posts VALUES (...)
```

### 중복 실행 방지

| SQL | 중복 방지 |
|-----|----------|
| `CREATE TABLE IF NOT EXISTS` | SQLite 네이티브 지원 |
| `CREATE INDEX IF NOT EXISTS` | SQLite 네이티브 지원 |
| `INSERT INTO posts (slug, ...)` | `slug UNIQUE` 제약조건 → 중복 시 에러 → try-catch 무시 |

### 시드 데이터 특성

- 10개 블로그 포스트 (MDX 마이그레이션)
- HTML 필드에 컴파일된 마크다운 포함 (큰 문자열)
- `INSERT INTO` 단순 문법 (D1/SQLite 공통)

---

## 5. 구현 순서 (Do Phase 가이드)

```
Step 1: 패키지 설치
─────────────────────────────────────
  cd apps/web
  pnpm add -D better-sqlite3 @types/better-sqlite3

Step 2: lib/local-db.ts 생성 (신규)
─────────────────────────────────────
  - LocalD1PreparedStatement 클래스
  - LocalD1Database 클래스
  - getLocalDB() 싱글턴 + 자동 마이그레이션

Step 3: lib/db.ts 수정
─────────────────────────────────────
  - top-level import 제거
  - getDB() 환경변수 분기 + 동적 require

Step 4: lib/auth.ts 수정
─────────────────────────────────────
  - top-level import 제거
  - verifyAdminAuth() 환경변수 분기

Step 5: 환경 설정 파일
─────────────────────────────────────
  - .env.local 생성
  - .gitignore 업데이트
  - package.json scripts 추가

Step 6: 검증
─────────────────────────────────────
  - pnpm dev 실행
  - /blog 목록 확인
  - /blog/[slug] 상세 확인
  - /admin CRUD 테스트
  - /sitemap.xml 확인
  - pnpm build 프로덕션 빌드 성공 확인
```

---

## 6. 요구사항 추적 매트릭스

| 요구사항 | 구현 파일 | 검증 방법 |
|----------|----------|----------|
| FR-01 블로그 SSR | `lib/db.ts`, `lib/local-db.ts` | `/blog` 페이지 렌더링 |
| FR-02 Admin CRUD | `lib/db.ts`, `lib/auth.ts`, `lib/local-db.ts` | Admin에서 글 생성/수정/삭제 |
| FR-03 sitemap | `lib/db.ts`, `lib/local-db.ts` | `/sitemap.xml` 접근 |
| FR-04 자동 초기화 | `lib/local-db.ts` → `runMigrations()` | 첫 pnpm dev에서 자동 |
| FR-05 프로덕션 무영향 | `lib/db.ts` 동적 require | `pnpm build` 성공 |
| FR-06 데이터 리셋 | `package.json` → `db:reset` | `pnpm db:reset` 실행 |
| FR-07 RETURNING 호환 | `better-sqlite3` v11+ | createPost/updatePost 동작 |
| FR-08 인증 지원 | `lib/auth.ts` | Bearer token 인증 성공 |
| NFR-01 최소 변경 | `db.ts`, `auth.ts` 2파일만 | diff 확인 |
| NFR-02 devDep만 | `package.json` devDependencies | 프로덕션 빌드 번들 미포함 |
| NFR-03 gitignore | `.gitignore` | `git status`에 sqlite 미표시 |
| NFR-04 자동 초기화 | `getLocalDB()` 싱글턴 | 별도 셋업 없이 동작 |

---

## 7. 참고

- Plan: `docs/01-plan/features/local-sqlite-setup.plan.md`
- 초안 Design: `docs/02-design/local-sqlite-setup.design.md`
- DB 스키마: `migrations/0001_create_posts.sql`
- 현재 DB: `lib/db.ts`
- 현재 Auth: `lib/auth.ts`
