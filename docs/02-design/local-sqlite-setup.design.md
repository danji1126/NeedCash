# 로컬 SQLite 개발 환경 구축 설계

## 1. 현재 상황 분석

### 문제점
- `lib/db.ts`와 `lib/auth.ts`가 `getCloudflareContext()`에 직접 의존
- `pnpm dev` (Next.js dev server)에서는 Cloudflare Workers 런타임이 없음
- D1 바인딩(`env.DB`)은 `wrangler dev` 또는 `pnpm preview`에서만 작동
- 로컬 개발 시 블로그/Admin 기능 테스트 불가

### 현재 DB 접근 흐름
```
Cloudflare Workers Runtime
  └→ getCloudflareContext() → { env }
       └→ env.DB → D1Database (SQLite 기반)
       └→ env.ADMIN_API_KEY → string
```

### 영향받는 파일
| 파일 | 사용 방식 |
|------|-----------|
| `lib/db.ts` | `getCloudflareContext()` → `env.DB` |
| `lib/auth.ts` | `getCloudflareContext()` → `env.ADMIN_API_KEY` |
| `app/blog/page.tsx` | `getAllPosts()` (SSR) |
| `app/blog/[slug]/page.tsx` | `getPostBySlug()` (SSR) |
| `app/sitemap.ts` | `getAllPosts()` (동적) |
| `app/api/posts/route.ts` | CRUD 함수들 |
| `app/api/posts/[slug]/route.ts` | CRUD 함수들 |
| `app/api/auth/verify/route.ts` | `verifyAdminAuth()` |
| `app/admin/**` | Admin CMS 전체 |

---

## 2. 설계 방향

### 핵심 원칙
- **기존 코드 최소 변경**: `lib/db.ts`의 `getDB()` 함수만 수정
- **D1 API 호환**: `better-sqlite3`를 D1Database 인터페이스로 래핑
- **환경 자동 감지**: Workers 런타임이면 D1, 아니면 로컬 SQLite
- **시드 데이터 공유**: 기존 마이그레이션 SQL 그대로 활용

### 접근 방식: Adapter 패턴

```
┌─────────────────────────────────────────────┐
│ lib/db.ts                                    │
│   getDB() → D1Database 인터페이스            │
└──────────┬──────────────────┬───────────────┘
           │                  │
   ┌───────▼──────┐  ┌───────▼──────────────┐
   │ Production   │  │ Local Dev            │
   │ D1Database   │  │ better-sqlite3       │
   │ (Workers)    │  │ → D1 래퍼            │
   └──────────────┘  └──────────────────────┘
```

---

## 3. 구현 계획

### Phase 1: 패키지 설치

```bash
cd apps/web
pnpm add -D better-sqlite3 @types/better-sqlite3
```

**better-sqlite3 선택 이유:**
- Node.js 네이티브 SQLite 바인딩 (가장 빠름)
- D1과 동일한 SQLite 엔진
- 동기식 API이지만 D1 래퍼로 비동기 변환 가능
- 널리 사용되는 안정적인 라이브러리

### Phase 2: D1 호환 래퍼 생성

**새 파일: `lib/local-db.ts`**

D1Database 인터페이스를 구현하는 래퍼 클래스:

```typescript
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), ".wrangler", "state", "v3", "d1", "local.sqlite");

// D1Database 호환 인터페이스 구현
class LocalD1Database {
  private db: Database.Database;

  constructor(dbPath: string) {
    // 디렉토리 생성
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

  // 마이그레이션 실행
  exec(sql: string): void {
    this.db.exec(sql);
  }
}

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
    const result = stmt.get(...this.params) as T | null;
    return result ?? null;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const stmt = this.db.prepare(this.sql);
    const info = stmt.run(...this.params);
    return { meta: { changes: info.changes } };
  }
}

// 싱글턴 인스턴스
let localDB: LocalD1Database | null = null;

export function getLocalDB(): LocalD1Database {
  if (!localDB) {
    localDB = new LocalD1Database(DB_PATH);
    initializeSchema(localDB);
  }
  return localDB;
}

function initializeSchema(db: LocalD1Database): void {
  // 마이그레이션 파일 실행
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    try {
      db.exec(sql);
    } catch {
      // 이미 존재하는 테이블/데이터는 무시
    }
  }
}
```

### Phase 3: `lib/db.ts` 수정

**변경 전:**
```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getDB(): D1Database {
  const { env } = getCloudflareContext();
  return env.DB;
}
```

**변경 후:**
```typescript
function getDB(): D1Database {
  try {
    // Production: Cloudflare Workers 런타임
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return env.DB;
  } catch {
    // Local Dev: better-sqlite3 래퍼
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
}
```

**대안 (환경변수 기반):**
```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  const { env } = getCloudflareContext();
  return env.DB;
}
```

### Phase 4: `lib/auth.ts` 수정

**변경 후:**
```typescript
export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);

  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return token === env.ADMIN_API_KEY;
  } catch {
    // 로컬: 환경변수에서 읽기
    return token === (process.env.ADMIN_API_KEY ?? "dev-secret-key");
  }
}
```

### Phase 5: 개발 스크립트 업데이트

**package.json scripts 추가:**
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:local": "USE_LOCAL_DB=true next dev",
    "db:seed": "tsx scripts/seed-local-db.ts",
    "db:reset": "rm -rf .wrangler/state/v3/d1 && pnpm db:seed"
  }
}
```

### Phase 6: .gitignore 업데이트

```gitignore
# Local SQLite
.wrangler/state/
*.sqlite
*.sqlite-wal
*.sqlite-shm
```

---

## 4. 디렉토리 구조 변경

```
apps/web/
  lib/
    db.ts              # ← 수정: getDB() 환경 감지 추가
    auth.ts            # ← 수정: verifyAdminAuth() 환경 감지 추가
    local-db.ts        # ← 신규: D1 호환 SQLite 래퍼
  .env.local           # ← 신규: USE_LOCAL_DB=true, ADMIN_API_KEY=...
```

---

## 5. 환경별 동작

| 항목 | `pnpm dev` (로컬) | `pnpm preview` (Workers) | Production |
|------|-------------------|--------------------------|------------|
| DB | better-sqlite3 | D1 (로컬 시뮬) | D1 (리모트) |
| 파일 위치 | `.wrangler/state/` | wrangler 관리 | Cloudflare |
| AUTH | `process.env` | `.dev.vars` | wrangler secret |
| 속도 | 즉시 | Workers 부팅 필요 | - |
| Hot Reload | 지원 | 미지원 | - |

---

## 6. RETURNING 절 호환성 이슈

### 문제
D1의 `RETURNING *` 구문은 SQLite 3.35.0+ 필요. `better-sqlite3`는 번들된 SQLite 버전에 따라 지원 여부가 다름.

### 해결 방안
`better-sqlite3` 최신 버전(v11+)은 SQLite 3.45+ 번들로 `RETURNING` 지원. 래퍼에서 `RETURNING *` 포함 쿼리를 특별 처리:

```typescript
async first<T>(): Promise<T | null> {
  const stmt = this.db.prepare(this.sql);

  if (this.sql.trim().toUpperCase().includes("RETURNING")) {
    // RETURNING이 포함된 INSERT/UPDATE → get()으로 실행
    const result = stmt.get(...this.params) as T | null;
    return result ?? null;
  }

  const result = stmt.get(...this.params) as T | null;
  return result ?? null;
}
```

---

## 7. 개발 워크플로우

### 최초 설정
```bash
cd apps/web
pnpm add -D better-sqlite3 @types/better-sqlite3
echo "USE_LOCAL_DB=true" >> .env.local
echo "ADMIN_API_KEY=dev-secret-key" >> .env.local
pnpm dev     # 자동으로 SQLite 파일 생성 + 마이그레이션 실행
```

### 일반 개발
```bash
pnpm dev     # Next.js HMR + 로컬 SQLite
# 브라우저에서 http://localhost:3000/blog 접근 가능
# Admin: http://localhost:3000/admin (API Key: dev-secret-key)
```

### 데이터 리셋
```bash
pnpm db:reset   # SQLite 파일 삭제 후 재생성
```

### 프로덕션 테스트
```bash
pnpm preview    # Workers 런타임 + D1 로컬 시뮬레이션
```

---

## 8. 체크리스트

- [ ] `better-sqlite3`, `@types/better-sqlite3` devDependency 설치
- [ ] `lib/local-db.ts` 생성 (D1 호환 래퍼)
- [ ] `lib/db.ts` 수정 (`getDB()` 환경 감지)
- [ ] `lib/auth.ts` 수정 (`verifyAdminAuth()` 환경 감지)
- [ ] `.env.local` 생성 (`USE_LOCAL_DB=true`, `ADMIN_API_KEY`)
- [ ] `.gitignore` 업데이트 (SQLite 파일 제외)
- [ ] `package.json` scripts 추가 (`dev:local`, `db:reset`)
- [ ] `RETURNING *` 호환성 테스트
- [ ] 블로그 목록/상세 페이지 SSR 테스트
- [ ] Admin CRUD 기능 테스트
- [ ] sitemap 동적 생성 테스트

---

## 9. 리스크 및 대안

### 리스크
| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| `better-sqlite3` 네이티브 빌드 실패 | 설치 불가 | `sql.js` (WASM 기반) 대안 사용 |
| D1 API 불일치 | 쿼리 실패 | 래퍼 단위 테스트로 사전 검증 |
| `RETURNING` 미지원 | createPost/updatePost 실패 | INSERT 후 SELECT로 대체 |

### 대안: `sql.js` (WASM 기반)
네이티브 컴파일 없이 순수 JavaScript로 동작:
```bash
pnpm add -D sql.js
```
- 장점: 빌드 도구 불필요, 크로스 플랫폼
- 단점: `better-sqlite3` 대비 느림, `RETURNING` 미지원

### 대안: `wrangler dev` 직접 사용
별도 수정 없이 Wrangler가 D1을 로컬 시뮬레이션:
```bash
npx wrangler d1 execute needcash-blog --local --file=migrations/0001_create_posts.sql
npx wrangler d1 execute needcash-blog --local --file=migrations/0002_seed_data.sql
pnpm preview   # opennextjs-cloudflare preview (wrangler dev 내장)
```
- 장점: 코드 변경 없음, 프로덕션과 동일 환경
- 단점: Next.js HMR 미지원, 빌드 필요, 느린 피드백 루프
