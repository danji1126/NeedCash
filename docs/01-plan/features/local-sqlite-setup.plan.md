# Plan: local-sqlite-setup

> **Feature**: local-sqlite-setup (로컬 SQLite 개발 환경 구축)
> **작성일**: 2026-02-27
> **우선순위**: P1 (중요)
> **의존성**: blog-db-migration 완료 (D1 기반 블로그 시스템)

---

## 1. 목적

`pnpm dev` (Next.js dev server) 환경에서 Cloudflare D1 없이도 블로그/Admin 기능을 테스트할 수 있도록 로컬 SQLite 개발 환경을 구축한다. Cloudflare Workers 런타임 의존성을 제거하여 빠른 HMR 개발 루프를 확보한다.

---

## 2. 현재 상태 분석

### 현재 아키텍처

```
Cloudflare Workers Runtime
  └→ getCloudflareContext() → { env }
       ├→ env.DB → D1Database (SQLite 기반)
       └→ env.ADMIN_API_KEY → string
```

### 환경별 가용성

| 기능 | `pnpm dev` | `pnpm preview` | Production |
|------|:----------:|:--------------:|:----------:|
| 블로그 목록/상세 | **불가** | 가능 | 가능 |
| Admin CRUD | **불가** | 가능 | 가능 |
| sitemap 동적 생성 | **불가** | 가능 | 가능 |
| 게임 페이지 | 가능 | 가능 | 가능 |
| 이력서 | 가능 | 가능 | 가능 |
| Hot Module Reload | 가능 | **불가** | N/A |

### 문제점

1. **D1 의존성**: `lib/db.ts`, `lib/auth.ts`가 `getCloudflareContext()`에 직접 의존
2. **개발 속도 저하**: `pnpm preview`는 빌드 필수 → HMR 미지원 → 피드백 루프 느림
3. **기능 테스트 불가**: 로컬에서 블로그/Admin 기능을 확인하려면 매번 빌드 필요

### 영향받는 파일 (8개)

| 파일 | D1 접근 방식 |
|------|-------------|
| `lib/db.ts` | `getCloudflareContext()` → `env.DB` |
| `lib/auth.ts` | `getCloudflareContext()` → `env.ADMIN_API_KEY` |
| `app/blog/page.tsx` | `getAllPosts()` SSR |
| `app/blog/[slug]/page.tsx` | `getPostBySlug()` SSR |
| `app/sitemap.ts` | `getAllPosts()` 동적 |
| `app/api/posts/route.ts` | CRUD 함수 |
| `app/api/posts/[slug]/route.ts` | CRUD 함수 |
| `app/api/auth/verify/route.ts` | `verifyAdminAuth()` |

---

## 3. 목표 아키텍처

```
┌──────────────────────────────────────────────────────┐
│  lib/db.ts → getDB()                                 │
│    환경 자동 감지                                     │
└─────────┬────────────────────────┬───────────────────┘
          │                        │
  ┌───────▼──────────┐    ┌───────▼──────────────────┐
  │ Production/Preview│    │ Local Dev (pnpm dev)     │
  │ getCloudflareCtx()│    │ better-sqlite3           │
  │ → env.DB (D1)    │    │ → D1 호환 래퍼           │
  └──────────────────┘    └──────────────────────────┘
```

### 설계 원칙

- **Adapter 패턴**: `getDB()` 한 곳만 분기, 나머지 코드 변경 없음
- **D1 API 호환**: `prepare().bind().all/first/run()` 인터페이스 동일
- **자동 감지**: 환경변수(`USE_LOCAL_DB`) 또는 try-catch로 런타임 판별
- **마이그레이션 공유**: 기존 `migrations/*.sql` 파일 그대로 활용

---

## 4. 요구사항

### 기능 요구사항 (FR)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `pnpm dev`에서 블로그 목록/상세 SSR 동작 | P0 |
| FR-02 | `pnpm dev`에서 Admin CRUD 동작 | P0 |
| FR-03 | `pnpm dev`에서 sitemap 동적 생성 동작 | P1 |
| FR-04 | 기존 마이그레이션 SQL로 스키마+시드 데이터 자동 초기화 | P0 |
| FR-05 | `pnpm preview` 및 Production 동작에 영향 없음 | P0 |
| FR-06 | 데이터 리셋 커맨드 제공 (`pnpm db:reset`) | P1 |
| FR-07 | `RETURNING *` 구문 호환 | P0 |
| FR-08 | Admin 인증 로컬 환경 지원 | P0 |

### 비기능 요구사항 (NFR)

| ID | 요구사항 |
|----|----------|
| NFR-01 | 기존 코드 변경 최소화 (db.ts, auth.ts 2개 파일만 수정) |
| NFR-02 | devDependency만 추가 (프로덕션 번들 영향 없음) |
| NFR-03 | SQLite 파일은 .gitignore에 추가 |
| NFR-04 | 최초 `pnpm dev` 실행 시 자동 초기화 (별도 셋업 불필요) |

---

## 5. 기술 선택

### better-sqlite3 (선정)

| 항목 | 내용 |
|------|------|
| 패키지 | `better-sqlite3` + `@types/better-sqlite3` |
| 유형 | Node.js 네이티브 SQLite 바인딩 |
| SQLite 버전 | 3.45+ (번들) → `RETURNING` 지원 |
| 성능 | Node.js SQLite 중 최고 성능 |
| API | 동기식 → D1 래퍼에서 비동기 변환 |

### 비교 대안

| 라이브러리 | 장점 | 단점 | 결론 |
|-----------|------|------|------|
| `better-sqlite3` | 최고 성능, RETURNING 지원, D1 동일 엔진 | 네이티브 빌드 필요 | **채택** |
| `sql.js` (WASM) | 빌드 도구 불필요, 크로스 플랫폼 | 느림, RETURNING 미지원 | 대안 |
| `wrangler dev` 직접 | 코드 변경 없음 | HMR 없음, 빌드 필수 | 보조 |

---

## 6. 구현 범위

### 신규 파일

| 파일 | 역할 |
|------|------|
| `lib/local-db.ts` | D1Database 호환 SQLite 래퍼 클래스 |
| `.env.local` | `USE_LOCAL_DB=true`, `ADMIN_API_KEY=dev-secret-key` |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/db.ts` | `getDB()` 환경 감지 분기 추가 |
| `lib/auth.ts` | `verifyAdminAuth()` 환경 감지 분기 추가 |
| `package.json` | `better-sqlite3` devDep 추가, scripts 추가 |
| `.gitignore` | SQLite 파일 패턴 추가 |

### 변경하지 않는 파일

- `app/blog/**` (페이지 컴포넌트)
- `app/api/**` (API 라우트)
- `app/admin/**` (Admin CMS)
- `app/sitemap.ts`
- `migrations/**` (기존 SQL 그대로 사용)
- `wrangler.toml`

---

## 7. 구현 순서

```
Phase 1: 패키지 설치
  └→ pnpm add -D better-sqlite3 @types/better-sqlite3

Phase 2: D1 호환 래퍼 생성
  └→ lib/local-db.ts (LocalD1Database, LocalD1PreparedStatement)

Phase 3: db.ts 수정
  └→ getDB() 환경 감지 (try-catch 또는 USE_LOCAL_DB)

Phase 4: auth.ts 수정
  └→ verifyAdminAuth() 환경 감지

Phase 5: 환경 설정
  └→ .env.local, .gitignore, package.json scripts

Phase 6: 검증
  └→ pnpm dev → 블로그/Admin/sitemap 테스트
```

---

## 8. 리스크 분석

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|:----:|:----:|----------|
| `better-sqlite3` 네이티브 빌드 실패 | 낮음 | 높음 | `sql.js` WASM 대안 준비 |
| D1 API 불일치 (edge case) | 중간 | 중간 | 래퍼 통합 테스트 |
| `RETURNING` 미지원 (구 버전) | 낮음 | 높음 | better-sqlite3 v11+ 고정 |
| 프로덕션 빌드 영향 | 낮음 | 높음 | devDependency만 사용, 동적 require |
| 시드 데이터 SQL 호환성 | 낮음 | 낮음 | `INSERT OR IGNORE` 패턴 |

---

## 9. 성공 기준

| 기준 | 검증 방법 |
|------|----------|
| `pnpm dev` → `/blog` 목록 렌더링 | 브라우저 접근 |
| `pnpm dev` → `/blog/[slug]` 상세 렌더링 | 브라우저 접근 |
| `pnpm dev` → `/admin` CRUD 동작 | Admin에서 글 생성/수정/삭제 |
| `pnpm dev` → `/sitemap.xml` 동적 생성 | URL 접근 |
| `pnpm preview` 기존 동작 유지 | Workers 런타임 테스트 |
| `pnpm build` 프로덕션 빌드 성공 | 빌드 커맨드 실행 |

---

## 10. 개발 워크플로우

### 최초 설정 (1회)
```bash
cd apps/web
pnpm add -D better-sqlite3 @types/better-sqlite3
# .env.local은 코드에서 자동 생성 또는 수동 설정
```

### 일반 개발
```bash
pnpm dev
# → 자동으로 로컬 SQLite 초기화 (마이그레이션 실행)
# → http://localhost:3000/blog 테스트 가능
# → http://localhost:3000/admin (API Key: dev-secret-key)
```

### 데이터 리셋
```bash
pnpm db:reset
# → SQLite 파일 삭제 → 다음 pnpm dev에서 재생성
```

### 프로덕션 환경 테스트
```bash
pnpm preview
# → opennextjs-cloudflare + wrangler dev (D1 로컬 시뮬레이션)
```

---

## 11. 참고 문서

- Design: `docs/02-design/local-sqlite-setup.design.md`
- DB 스키마: `migrations/0001_create_posts.sql`
- 시드 데이터: `migrations/0002_seed_data.sql`
- 현재 DB 레이어: `lib/db.ts`
- 현재 인증: `lib/auth.ts`
