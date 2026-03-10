# 보안/품질팀 분석 보고서

> 분석일: 2026-03-10

## 1. 보안 분석

### 1.1 인증 & 인가

| 항목 | 상태 | 설명 |
|------|------|------|
| Admin 인증 방식 | ⚠️ | Bearer API Key (단순하지만 1인 운영에 적정) |
| 토큰 비교 | ❌ | `===` 사용 → **timing attack 취약**. `crypto.subtle.timingSafeEqual()` 권장 |
| 토큰 저장 | ⚠️ | 클라이언트 localStorage (XSS 시 탈취 가능) |
| 토큰 만료 | ❌ | 없음 (영구 유효) |
| 하드코딩 폴백 | ❌ | `process.env.ADMIN_API_KEY ?? "dev-secret-key"` → 환경변수 미설정 시 고정키 사용 |
| Rate Limiting (Admin) | ❌ | 없음 |
| RBAC | ❌ | 역할 구분 없음 (단일 관리자) |
| 감사 로그 | ❌ | Admin 작업 기록 없음 |

### 1.2 XSS 위험 분석

**`dangerouslySetInnerHTML` 사용 위치:**

| 위치 | 데이터 소스 | 위험도 | 비고 |
|------|------------|--------|------|
| `markdown-editor.tsx:93` | `marked.parse(value)` | **높음** | Admin만 접근하지만 Markdown → HTML 변환 시 스크립트 주입 가능 |
| 블로그 포스트 렌더링 | D1 저장된 HTML | **중간** | `compileMarkdown()`이 `allowDangerousHtml: true` + `rehypeRaw` 사용 |
| `layout.tsx:91-93` | 인라인 스크립트 | **낮음** | 정적 코드, 사용자 입력 아님 |

**`compile-markdown.ts` 분석:**
```typescript
// allowDangerousHtml: true → 원본 HTML 태그 보존
// rehypeRaw → HTML 태그 파싱
.use(remarkRehype, { allowDangerousHtml: true })
.use(rehypeRaw)
```
- Admin만 글을 작성하므로 현실적 위험은 낮으나, `rehype-sanitize` 추가로 방어 가능

### 1.3 SQL Injection

| 항목 | 상태 |
|------|------|
| Prepared Statements | ✅ 모든 DB 쿼리에 사용 |
| 동적 SQL | ⚠️ `updatePost()`에서 동적 SET 절 구성 (값은 바인딩) |
| ORDER BY | ⚠️ `scores.ts`에서 `${order}` 직접 삽입 (enum 값이라 안전) |

`updatePost()`의 동적 SQL:
```typescript
// 값은 bind로 안전하지만, 컬럼명이 하드코딩 조건문으로 구성
const row = await db
  .prepare(`UPDATE posts SET ${sets.join(", ")} WHERE slug = ? RETURNING *`)
  .bind(...values)
  .first<PostRow>();
```
→ sets 배열이 하드코딩된 컬럼명으로만 구성되므로 안전. 단, 패턴을 map-based로 리팩토링 권장.

### 1.4 CSRF

- API가 REST JSON 기반이므로 브라우저 자동 폼 제출에 의한 CSRF 위험 낮음
- Admin API는 Authorization 헤더 필수 → CSRF 방어 충분

### 1.5 환경변수 관리

| 파일 | 내용 | 상태 |
|------|------|------|
| `.env.development` | `USE_LOCAL_DB=true`, `ADMIN_API_KEY=dev-secret-key` | ✅ Git 추적 (개발용) |
| `wrangler.toml` | D1/KV 바인딩, secret 참조 | ✅ 시크릿 미포함 |
| `.gitignore` | `.env*` 패턴 + `.env.development` 예외 | ✅ 적절 |

**주의**: `.env.development`에 `dev-secret-key`가 포함되어 Git에 커밋됨 → 개발용이므로 의도된 동작이나 README에 명시 권장

### 1.6 쿠키 보안

`lib/visitor.ts`의 `ncv_id` 쿠키:
- HttpOnly ✅ (JavaScript 접근 불가)
- `path: "/"`, `maxAge: 365일` → SameSite, Secure 속성 확인 필요

## 2. 성능 분석

### 2.1 번들 사이즈 영향

| 패키지 | 크기 (gzip 추정) | 클라이언트/서버 | 영향 |
|--------|-----------------|----------------|------|
| framer-motion | ~50KB | 클라이언트 | 높음 - 트리쉐이킹 적용 확인 필요 |
| shiki | ~500KB+ | 서버 | 낮음 (SSR) 단 Workers 번들에 포함 |
| marked | ~15KB | 클라이언트 | 중간 - Admin 에디터에서만 사용 |
| @teachablemachine/image | ~40KB | 클라이언트 | 낮음 - dynamic import로 게임에서만 로드 |

### 2.2 캐싱 전략

| 리소스 | Cache-Control | 상태 |
|--------|---------------|------|
| 리더보드 (`/api/scores/[game]`) | `max-age=60` | ✅ 적절 |
| 포스트 목록 (`/api/posts`) | 없음 | ⚠️ 추가 권장 |
| 정적 자산 | Workers 기본값 | ✅ |
| highlight.js CSS | CDN (브라우저 캐시) | ⚠️ CDN 의존성 |

### 2.3 렌더링 최적화

- `content-visibility: auto` 적용: 리스트 아이템, 푸터 → 스크롤 외 요소 지연 렌더링 ✅
- `@media (prefers-reduced-motion: reduce)` 지원 ✅
- `display: "swap"` 폰트 전략 ✅

### 2.4 이미지/자산

- 폰트: Pretendard subset woff2 (로컬 호스팅) → 최적
- highlight.js: CDN 외부 로드 → First Paint 차단 가능성

## 3. 코드 품질

### 3.1 TypeScript 설정

```json
{
  "strict": true,              // ✅ strict 모드
  "noEmit": true,              // ✅ 빌드 전용
  "isolatedModules": true,     // ✅ 각 파일 독립 컴파일
  "resolveJsonModule": true,   // ✅ JSON import 지원
  "skipLibCheck": true         // ⚠️ 라이브러리 타입 체크 건너뜀
}
```

### 3.2 코드 중복 패턴

| 패턴 | 중복 수 | 위치 |
|------|---------|------|
| `getDB()` | 3곳 | db.ts, scores.ts, analytics.ts |
| `getCloudflareContext()` require | 4곳 | db.ts, scores.ts, analytics.ts, auth.ts |
| 디자인별 switch 문 | 3곳 | header.tsx, footer.tsx, home-page.tsx |
| `eslint-disable @typescript-eslint/no-require-imports` | 6곳 | 환경 분기 코드 |

### 3.3 에러 처리 일관성

| API | try-catch | 에러 응답 형식 | 상태 |
|-----|-----------|---------------|------|
| `POST /api/posts` | ❌ | `{ error: string }` | 400만 처리 |
| `POST /api/scores` | ❌ | `{ error: string }` | 400/429 처리 |
| `POST /api/analytics/pageview` | ✅ (AE만) | 없음 (204) | 부분 처리 |
| `GET /api/posts` | ❌ | 없음 | DB 에러 시 500 |

### 3.4 eslint-disable 사용

```
// 반복 패턴 - Cloudflare 런타임 동적 import 때문
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getCloudflareContext } = require("@opennextjs/cloudflare");
```
→ `@opennextjs/cloudflare`의 동적 require가 불가피한 제약. 공통 모듈로 추출하면 disable 주석을 1곳으로 집중 가능.

## 4. 테스트 현황

| 유형 | 상태 |
|------|------|
| 단위 테스트 | ❌ 없음 |
| 통합 테스트 | ❌ 없음 |
| E2E 테스트 | ❌ 없음 |
| 타입 체크 | ✅ strict 모드 |
| 린트 | ✅ ESLint 9 |

테스트 코드가 전혀 없는 상태. 최소한 다음 영역의 테스트를 권장:
1. `score-validation.ts`: 점수/닉네임 검증 로직 (순수 함수, 테스트 용이)
2. `db.ts`: CRUD 함수 (로컬 SQLite로 테스트 가능)
3. API 라우트: 인증, 입력 검증 시나리오

## 5. 개선 우선순위

### P0 (즉시)
1. **Stored XSS 방지**: `compile-markdown.ts`에 `rehype-sanitize` 추가 (`allowDangerousHtml: true` + `rehypeRaw` 조합이 위험)
2. **Admin 미리보기 XSS**: `marked.parse()` 결과에 DOMPurify 적용
3. **하드코딩 시크릿 폴백 제거**: `auth.ts:8`의 `"dev-secret-key"` 폴백 → 환경변수 필수화
4. **보안 헤더 추가**: `next.config.ts` 또는 `middleware.ts`에 CSP, X-Frame-Options, HSTS 설정

### P1 (중요)
5. **timing-safe 토큰 비교**: `===` → `crypto.subtle.timingSafeEqual()` 사용
6. **API 전역 에러 핸들링**: `request.json()` 파싱 실패 등 unhandled rejection 방지
7. **slug 포맷 검증**: `POST /api/posts`에서 slug에 특수문자/경로순회 차단
8. **ncv_id 쿠키 보안 속성**: `SameSite=Lax`, `Secure=true` 확인
9. **metadata 필드 검증**: 크기 제한 (ex: 1KB) + 타입 검증

### P2 (권장)
10. **getDB() 중복 해소**: 4곳 → 공통 환경 모듈 생성 (eslint-disable도 1곳으로 집중)
11. **최소 단위 테스트 추가**: score-validation, compile-markdown (순수 함수, 테스트 용이)
12. **highlight.js CSS 셀프 호스팅**: 외부 CDN 의존 제거
13. **API 응답 형식 통일**: `{ data, error, meta }` 패턴
14. **pageview rate limiting**: IP 기반 rate limit으로 auto-block 강제 트리거 방지
