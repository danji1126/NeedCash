# Plan: blog-db-migration

> **Feature**: blog-db-migration (블로그 D1 데이터베이스 마이그레이션)
> **작성일**: 2026-02-26
> **우선순위**: P1 (중요)
> **의존성**: Cloudflare Workers 마이그레이션 완료 (feature/backend-service 브랜치)

---

## 1. 목적

현재 MDX 파일 기반으로 관리되는 블로그 시스템을 Cloudflare D1 데이터베이스로 전환하고, 관리자 페이지에서 글을 작성/수정/삭제할 수 있는 완전한 동적 블로그 CMS를 구축한다.

---

## 2. 현재 상태 분석

### 현재 아키텍처

```
content/blog/*.mdx (10개 파일)
  ↓ (빌드 시 generate-blog-data.mjs 실행)
lib/generated/blog-data.ts (메타데이터 + raw content + HTML 번들)
  ↓ (import)
app/blog/page.tsx (목록)
app/blog/[slug]/page.tsx (상세 - dangerouslySetInnerHTML)
```

### 현재 구성 요소

| 구성 | 파일 | 역할 |
|------|------|------|
| MDX 콘텐츠 | `content/blog/*.mdx` | 블로그 원본 (10개) |
| 빌드 스크립트 | `scripts/generate-blog-data.mjs` | MDX → HTML 컴파일 + TS 파일 생성 |
| 생성 데이터 | `lib/generated/blog-data.ts` | 빌드타임 생성 데이터 (gitignore) |
| 데이터 레이어 | `lib/mdx.ts` | getAllPosts(), getPostBySlug(), extractHeadings() |
| 블로그 목록 | `app/blog/page.tsx` | force-static, PostList 컴포넌트 |
| 블로그 상세 | `app/blog/[slug]/page.tsx` | generateStaticParams, dangerouslySetInnerHTML |

### 현재 한계

1. **콘텐츠 추가 시 재빌드 필요**: MDX 파일 추가 → `pnpm build` → 재배포
2. **빌드 번들에 모든 콘텐츠 포함**: 글이 늘어날수록 JS 번들 크기 증가
3. **비개발자 콘텐츠 관리 불가**: MDX 파일 직접 편집 + Git 커밋 필요
4. **검색/필터링 제한**: 클라이언트 사이드 필터링만 가능

### Workers 런타임 제약

- `fs` 모듈 사용 불가 (이미 해결됨 - 빌드타임 생성)
- `WebAssembly.instantiate()` 차단 → shiki/rehype-pretty-code 런타임 실행 불가
- D1은 SQLite 기반 → JSON 칼럼, 전문 검색(FTS) 지원

---

## 3. 목표 아키텍처

```
┌─────────────────────────────────────────────────┐
│  관리자 (Admin Page)                             │
│  /admin/blog       → 포스트 목록/관리            │
│  /admin/blog/new   → 새 글 작성 (Markdown 에디터) │
│  /admin/blog/[id]  → 글 수정                     │
│      ↓ (인증된 요청)                              │
├─────────────────────────────────────────────────┤
│  API Routes                                      │
│  GET  /api/posts          → 목록 조회            │
│  GET  /api/posts/[slug]   → 단일 조회            │
│  POST /api/posts          → 생성 (🔒 인증)       │
│  PUT  /api/posts/[slug]   → 수정 (🔒 인증)       │
│  DELETE /api/posts/[slug] → 삭제 (🔒 인증)       │
│      ↕                                           │
│  Cloudflare D1 (posts 테이블)                     │
├─────────────────────────────────────────────────┤
│  사용자 (Public)                                  │
│  /blog              → 목록 (SSR, D1 조회)        │
│  /blog/[slug]       → 상세 (SSR, D1 조회)        │
└─────────────────────────────────────────────────┘
```

### 핵심 변경점

| Before | After |
|--------|-------|
| MDX 파일 (정적) | D1 데이터베이스 (동적) |
| 빌드타임 HTML 컴파일 | API에서 저장 시 HTML 컴파일 (rehype-highlight) |
| `force-static` + generateStaticParams | 동적 렌더링 (SSR) |
| JS 번들에 전체 콘텐츠 포함 | 요청 시 D1에서 조회 |
| Git으로 콘텐츠 관리 | Admin 페이지에서 CRUD |
| 콘텐츠 관리에 개발 환경 필요 | 브라우저만으로 글 관리 가능 |

---

## 4. 요구사항

### FR-01: D1 데이터베이스 스키마

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,           -- ISO 8601 (YYYY-MM-DD)
  updated_at TEXT,              -- ISO 8601
  category TEXT NOT NULL DEFAULT 'etc',
  tags TEXT NOT NULL DEFAULT '[]',  -- JSON 배열
  published INTEGER NOT NULL DEFAULT 1,  -- 0 or 1
  reading_time INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,        -- raw markdown
  html TEXT NOT NULL,           -- pre-compiled HTML
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(slug)
);

CREATE INDEX idx_posts_published ON posts(published, date DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_slug ON posts(slug);
```

- `tags`는 JSON 배열로 저장 (SQLite JSON 함수로 쿼리 가능)
- `html`은 사전 컴파일된 HTML (Workers 런타임에서 MDX 컴파일 불가하므로)
- `published`는 INTEGER (SQLite에 BOOLEAN 없음)

### FR-02: D1 바인딩 설정

`wrangler.toml`에 D1 바인딩 추가:
```toml
[[d1_databases]]
binding = "DB"
database_name = "needcash-blog"
database_id = "<생성 후 ID>"
```

### FR-03: 데이터 접근 레이어

`lib/db.ts` 신규 생성 - D1 쿼리 함수:
- `getAllPosts()`: 게시된 포스트 목록 (메타데이터만, 날짜 역순)
- `getPostBySlug(slug)`: 단일 포스트 (메타 + content + html)
- `getPostsByCategory(category)`: 카테고리별 조회
- `searchPosts(query)`: 제목/설명 검색 (LIKE 또는 FTS)

### FR-04: 마이그레이션 스크립트

기존 MDX 파일 10개를 D1으로 이전하는 스크립트:
1. `content/blog/*.mdx` 파일 읽기
2. gray-matter로 frontmatter 파싱
3. unified 파이프라인으로 HTML 컴파일 (기존 `generate-blog-data.mjs` 로직 재사용)
4. D1에 INSERT

### FR-05: 블로그 페이지 수정

- `app/blog/page.tsx`: `force-static` 제거, D1에서 목록 조회
- `app/blog/[slug]/page.tsx`: `generateStaticParams` 제거, D1에서 개별 조회
- `lib/mdx.ts`: D1 쿼리 기반으로 전환 (기존 인터페이스 유지)

### FR-06: HTML 컴파일 전략

Workers 런타임에서 shiki(WASM) 실행 불가하므로 코드 하이라이팅을 `rehype-highlight`(highlight.js 기반, 순수 JS)로 교체:
- **마이그레이션 시**: Node.js 스크립트에서 unified + rehype-pretty-code로 기존 글 컴파일
- **Admin API 저장 시**: Workers에서 unified + `rehype-highlight`로 실시간 컴파일 (WASM 불필요)
- D1에 `content`(raw markdown)와 `html`(compiled HTML) 모두 저장
- 기존 글은 rehype-pretty-code(shiki) 하이라이팅 유지, 신규 글은 highlight.js 스타일 적용

### FR-07: 블로그 CRUD API Routes

| 엔드포인트 | 메서드 | 인증 | 기능 |
|------------|--------|------|------|
| `/api/posts` | GET | 불필요 | 게시된 포스트 목록 |
| `/api/posts/[slug]` | GET | 불필요 | 단일 포스트 조회 |
| `/api/posts` | POST | 필요 | 새 포스트 생성 (markdown → html 컴파일 포함) |
| `/api/posts/[slug]` | PUT | 필요 | 포스트 수정 (html 재컴파일) |
| `/api/posts/[slug]` | DELETE | 필요 | 포스트 삭제 |

요청/응답 형식:
- POST/PUT body: `{ title, slug, description, category, tags, content, published }`
- API에서 `content`를 받아 `html`로 컴파일 후 D1에 저장
- `reading_time`은 서버에서 자동 계산

### FR-08: Admin 인증

초기 단계에서는 간단한 인증 방식 채택:
- **환경변수 기반 API Key**: `ADMIN_API_KEY`를 wrangler secret으로 설정
- Admin 페이지 로그인: API Key 입력 → 브라우저 세션에 저장 (localStorage/cookie)
- API 요청 시 `Authorization: Bearer <API_KEY>` 헤더 포함
- 차후 OAuth/소셜 로그인으로 업그레이드 가능

### FR-09: Admin 페이지 UI

| 페이지 | 경로 | 기능 |
|--------|------|------|
| 로그인 | `/admin` | API Key 입력, 인증 |
| 포스트 관리 | `/admin/blog` | 전체 포스트 목록 (published/draft 구분), 삭제 |
| 새 글 작성 | `/admin/blog/new` | Markdown 에디터 + 실시간 미리보기 |
| 글 수정 | `/admin/blog/[id]/edit` | 기존 글 편집 |

Admin 에디터 요구사항:
- 좌우 분할 레이아웃: 왼쪽 Markdown 입력, 오른쪽 HTML 미리보기
- 메타데이터 입력 폼: title, slug(auto-generate), description, category, tags
- published 토글 (초안/게시)
- 자동 저장 (draft) 또는 수동 저장
- Markdown 툴바: 볼드, 이탤릭, 링크, 이미지, 코드블록 등 기본 서식

### FR-10: Admin 페이지 보안

- `/admin/*` 경로는 `robots.txt`에서 Disallow
- Admin 페이지는 `"use client"` 컴포넌트 (클라이언트 렌더링)
- sitemap에서 admin 경로 제외
- 인증 실패 시 API 호출 차단 (401 응답)

---

## 5. 구현 순서

### Phase 1: D1 설정 + 스키마

1. `wrangler d1 create needcash-blog` 실행
2. `wrangler.toml`에 D1 바인딩 추가
3. `migrations/0001_create_posts.sql` 스키마 파일 생성
4. `wrangler d1 migrations apply needcash-blog` 실행

### Phase 2: 데이터 마이그레이션

1. MDX → D1 마이그레이션 스크립트 작성 (`scripts/migrate-blog-to-d1.mjs`)
2. 기존 10개 MDX 파일을 D1에 INSERT
3. 데이터 검증 (개수, 내용 일치 확인)

### Phase 3: 데이터 레이어 교체

1. `lib/db.ts` 생성 (D1 쿼리 함수)
2. `lib/mdx.ts` 수정: generated 파일 import → D1 쿼리
3. 블로그 페이지에서 D1 데이터 사용하도록 전환
4. `force-static`, `generateStaticParams` 제거

### Phase 4: CRUD API Routes

1. `app/api/posts/route.ts` 생성 (GET 목록, POST 생성)
2. `app/api/posts/[slug]/route.ts` 생성 (GET 상세, PUT 수정, DELETE 삭제)
3. Markdown → HTML 컴파일 유틸리티 (`lib/compile-markdown.ts`)
   - unified + remark-parse + remark-gfm + remark-rehype + rehype-highlight + rehype-slug + rehype-stringify
   - Workers 런타임 호환 (WASM 없이 동작)
4. API Key 인증 미들웨어 (`lib/auth.ts`)
5. `wrangler secret put ADMIN_API_KEY` 설정

### Phase 5: Admin 페이지

1. Admin 레이아웃 (`app/admin/layout.tsx`) - 인증 상태 관리
2. 로그인 페이지 (`app/admin/page.tsx`) - API Key 입력
3. 포스트 관리 목록 (`app/admin/blog/page.tsx`) - CRUD 대시보드
4. 새 글 작성 (`app/admin/blog/new/page.tsx`) - Markdown 에디터 + 미리보기
5. 글 수정 (`app/admin/blog/[id]/edit/page.tsx`) - 기존 글 편집
6. `robots.txt`에 `/admin` Disallow 추가
7. `sitemap.ts`에서 admin 경로 제외

### Phase 6: 정리 + 테스트

1. `scripts/generate-blog-data.mjs` 제거
2. `lib/generated/` 디렉토리 제거
3. package.json에서 `generate:blog` 스크립트 제거
4. 빌드타임 MDX 관련 devDependencies 정리
5. `rehype-highlight` + 관련 CSS 추가
6. 로컬 Workers 프리뷰에서 전체 흐름 테스트
   - Public: 블로그 목록/상세 정상 표시
   - Admin: 로그인 → 글 작성 → 목록 확인 → 수정 → 삭제

---

## 6. 기술 결정

### 6.1 HTML 컴파일 시점

| 방식 | 장점 | 단점 |
|------|------|------|
| **API 저장 시 서버 컴파일** (채택) | 일관된 HTML 품질, Workers에서 실행 가능 | rehype-highlight로 코드 하이라이팅 제한 |
| 요청 시 컴파일 | 항상 최신 | 매 요청 CPU 소모, 응답 지연 |
| 클라이언트 사이드 컴파일 | 서버 부담 없음 | SEO 불리, 초기 로딩 느림 |

→ **결정**: API에서 Markdown 저장 시 즉시 HTML 컴파일. D1에 `content` + `html` 모두 저장. 코드 하이라이팅은 `rehype-highlight`(highlight.js 기반, 순수 JS) 사용으로 Workers 런타임 호환.

### 6.2 코드 하이라이팅 전환

| 도구 | 런타임 | Workers 호환 |
|------|--------|-------------|
| rehype-pretty-code (shiki) | WASM 필요 | X |
| **rehype-highlight (highlight.js)** (채택) | 순수 JS | O |

→ **결정**: 기존 글(마이그레이션)은 shiki HTML 유지. 신규 글은 highlight.js 스타일. CSS에서 두 스타일 모두 지원.

### 6.3 Admin 인증 방식

| 방식 | 복잡도 | 보안 |
|------|--------|------|
| **환경변수 API Key** (채택) | 낮음 | 1인 관리에 충분 |
| OAuth / 소셜 로그인 | 높음 | 높음 |
| Basic Auth | 낮음 | 낮음 (base64 평문) |

→ **결정**: `ADMIN_API_KEY` 환경변수. 1인 운영 프로젝트에 적합. 차후 필요 시 OAuth 업그레이드.

### 6.4 캐싱 전략

- D1 조회는 빠르지만, 매 요청마다 DB 쿼리 불필요
- Next.js `unstable_cache` 또는 Cloudflare KV로 응답 캐싱 고려
- 초기에는 캐싱 없이 시작, 필요 시 추가

### 6.5 D1 접근 방식

- OpenNext Cloudflare에서 `getRequestContext()`를 통해 Cloudflare 바인딩에 접근
- `@opennextjs/cloudflare`의 `getCloudflareContext()` 사용
- Server Component + API Route에서 D1 쿼리 가능

---

## 7. 영향 범위

### 수정 파일

| 파일 | 변경 |
|------|------|
| `wrangler.toml` | D1 바인딩 추가 |
| `lib/mdx.ts` | D1 쿼리 기반으로 전환 |
| `app/blog/page.tsx` | force-static 제거, 동적 렌더링 |
| `app/blog/[slug]/page.tsx` | generateStaticParams 제거, D1 조회 |
| `app/page.tsx` | 홈 블로그 섹션 D1 조회 |
| `app/sitemap.ts` | D1에서 블로그 슬러그 조회 |
| `app/robots.ts` | `/admin` Disallow 추가 |
| `package.json` | generate:blog 제거, rehype-highlight 추가, 빌드타임 deps 정리 |

### 신규 파일

| 파일 | 역할 |
|------|------|
| `lib/db.ts` | D1 쿼리 함수 |
| `lib/compile-markdown.ts` | Markdown → HTML 컴파일 (Workers 호환) |
| `lib/auth.ts` | Admin API Key 인증 유틸리티 |
| `app/api/posts/route.ts` | 블로그 목록 GET + 생성 POST |
| `app/api/posts/[slug]/route.ts` | 블로그 상세 GET + 수정 PUT + 삭제 DELETE |
| `app/admin/layout.tsx` | Admin 레이아웃 + 인증 상태 관리 |
| `app/admin/page.tsx` | Admin 로그인 페이지 |
| `app/admin/blog/page.tsx` | 포스트 관리 목록 |
| `app/admin/blog/new/page.tsx` | 새 글 작성 (Markdown 에디터) |
| `app/admin/blog/[id]/edit/page.tsx` | 글 수정 |
| `components/admin/markdown-editor.tsx` | Markdown 에디터 + 미리보기 |
| `components/admin/post-form.tsx` | 메타데이터 입력 폼 |
| `scripts/migrate-blog-to-d1.mjs` | MDX → D1 마이그레이션 |
| `migrations/0001_create_posts.sql` | DB 스키마 |

### 삭제 파일

| 파일 | 이유 |
|------|------|
| `scripts/generate-blog-data.mjs` | 빌드타임 생성 불필요 |
| `lib/generated/blog-data.ts` | D1로 대체 |

### 보존 파일 (백업)

| 파일 | 이유 |
|------|------|
| `content/blog/*.mdx` | 마이그레이션 후에도 원본으로 보존 (차후 정리) |

---

## 8. 리스크

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| D1 접근 방식 호환 | 중 | 높음 | OpenNext의 Cloudflare 바인딩 접근 방식 사전 검증 |
| HTML 컴파일 파이프라인 | 낮음 | 중 | 기존 generate-blog-data.mjs 로직 재사용 |
| rehype-highlight Workers 호환 | 낮음 | 높음 | 순수 JS 라이브러리이므로 WASM 불필요, 사전 테스트 |
| SSR 전환 시 성능 | 낮음 | 중 | D1 Edge 쿼리 지연 측정, 필요 시 캐싱 |
| 기존 SEO 영향 | 중 | 중 | 기존 URL 구조 유지, 동적 sitemap 대응 |
| Admin 페이지 보안 | 중 | 높음 | API Key 인증, robots.txt Disallow, HTTPS 필수 |
| Admin에서 생성한 글 스타일 불일치 | 중 | 낮음 | highlight.js CSS 통합, prose 스타일 공유 |

---

## 9. 검증 기준

### Public (블로그 조회)

1. D1에 10개 포스트 정상 INSERT (마이그레이션)
2. `/blog` 목록 페이지 → D1에서 조회한 10개 포스트 표시
3. `/blog/[slug]` 상세 페이지 → D1에서 조회한 HTML 정상 렌더링
4. 코드 하이라이팅 정상 표시 (기존 글: shiki, 신규 글: highlight.js)
5. TOC (목차) 정상 동작
6. Related Posts 정상 동작
7. Sitemap에 블로그 URL 포함 (admin 경로 제외)
8. 홈페이지 블로그 섹션 정상 표시

### Admin (블로그 관리)

9. `/admin` 로그인 → API Key 인증 성공/실패
10. `/admin/blog` 전체 포스트 목록 표시 (published/draft 구분)
11. `/admin/blog/new` 새 글 작성 → Markdown 입력 → 미리보기 확인 → 저장
12. 저장된 글이 `/blog`에 즉시 반영 (재빌드 없이)
13. `/admin/blog/[id]/edit` 기존 글 수정 → HTML 재컴파일 → 반영
14. 포스트 삭제 → `/blog`에서 즉시 제거
15. 인증 없이 API 호출 시 401 응답
16. `robots.txt`에 `/admin` Disallow 확인

---

## 10. 롤백 계획

1. `lib/mdx.ts`를 generated 파일 import 방식으로 복원
2. `scripts/generate-blog-data.mjs` 복원
3. package.json에 `generate:blog` 스크립트 복원
4. 블로그 페이지에 `force-static`, `generateStaticParams` 복원
5. `pnpm build && pnpm cf-deploy`로 재배포
