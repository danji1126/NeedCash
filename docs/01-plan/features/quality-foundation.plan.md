# Plan: quality-foundation

> 코드베이스 품질 기반 구축 - 보안, 접근성, 코드 품질, SEO, 테스트 전반에 걸친 51개 개선 항목 통합 로드맵

## 1. Overview

### Purpose
needcash.dev 코드베이스(139개 파일, ~13,134줄)에 대한 종합 분석 결과 도출된 51개 개선 항목을 체계적으로 해결한다. 보안 취약점 제거, 접근성 기준 충족, 코드 품질 향상, SEO 강화를 통해 프로덕션 수준의 품질 기반을 확립한다.

### Background
- 프로젝트: NeedCash (Next.js 16 + React 19 + TypeScript + Tailwind CSS 4)
- 인프라: Cloudflare Workers + D1 + KV
- 분석 출처: `docs/05-analysis-report/05-improvements.md` (4개 팀 통합 분석)
- 분석 대상: 프론트엔드, 백엔드, 보안/품질, SEO/UX

### Current State Analysis

| 우선순위 | 항목 수 | 카테고리 |
|----------|---------|----------|
| P0 (즉시) | 12 | 보안 5, 접근성 1, UX 1, 코드 2, 번들 2, 테스트 1 |
| P1 (단기) | 16 | 보안 4, 접근성 4, SEO 3, 프론트엔드 3, 코드 2 |
| P2 (중기) | 15 | 코드 7, 프론트엔드 3, SEO 3, 보안 1, 접근성 1 |
| P3 (장기) | 8 | 문서 2, 프론트엔드 4, SEO 2 |
| **합계** | **51** | |

### Decisions
- 4개 Phase로 나누어 단계적 실행 (P0 → P1 → P2 → P3)
- 각 Phase 내에서도 의존성 순서 고려 (예: `getDB()` 통합 → API 에러 처리)
- 테스트 프레임워크는 Phase 1에서 구성, 이후 Phase마다 테스트 커버리지 확대
- 기존 코드 패턴 유지하며 점진적 개선 (대규모 리팩토링 지양)

## 2. Scope

### Phase 1: P0 보안 + 코드 기반 (즉시)

**보안 (SEC-01 ~ SEC-05)**

| ID | 항목 | 파일 | 조치 |
|----|------|------|------|
| SEC-01 | Stored XSS 방지 | `lib/compile-markdown.ts` | `rehype-sanitize` 파이프라인 추가 |
| SEC-02 | Admin 미리보기 XSS | `components/admin/markdown-editor.tsx` | DOMPurify 적용 |
| SEC-03 | 하드코딩 시크릿 폴백 | `lib/auth.ts` | 폴백 제거, 환경변수 없으면 인증 실패 |
| SEC-04 | 보안 헤더 미설정 | `next.config.ts` | CSP, X-Frame-Options 등 보안 헤더 추가 |
| SEC-05 | timing-unsafe 토큰 비교 | `lib/auth.ts` | `crypto.subtle.timingSafeEqual()` 사용 |

**코드 품질 (CODE-01 ~ CODE-02)**

| ID | 항목 | 파일 | 조치 |
|----|------|------|------|
| CODE-01 | `getDB()` 4곳 중복 | `lib/db.ts`, `scores.ts`, `analytics.ts`, API route | `lib/env.ts` 공통 모듈 생성 |
| CODE-02 | API 에러 처리 부재 | `app/api/` 11개 route.ts | try-catch + `{ error: string }` 형식 통일 |

**번들 최적화 (BUNDLE-01 ~ BUNDLE-02)**

| ID | 항목 | 파일 | 조치 |
|----|------|------|------|
| BUNDLE-01 | 미사용 의존성 3개 | `package.json` | `next-themes`, `next-mdx-remote`, `gray-matter` 제거 |
| BUNDLE-02 | 디자인 변형 정적 import | Header/Footer/HomePage | `next/dynamic` lazy loading |

**접근성 (ACC-01)**

| ID | 항목 | 파일 | 조치 |
|----|------|------|------|
| ACC-01 | text-muted WCAG AA 미달 | `app/globals.css` | 4.5:1 이상 대비로 색상 조정 |

**UX (UX-01)**

| ID | 항목 | 파일 | 조치 |
|----|------|------|------|
| UX-01 | loading/error.tsx 전무 | `app/` 전체 | 루트 + 주요 라우트에 추가 |

**테스트 (TEST-01 시작)**

| ID | 항목 | 조치 |
|----|------|------|
| TEST-01 | 테스트 프레임워크 구성 | vitest 도입 + `score-validation.ts`, `auth.ts` 단위 테스트 |

### Phase 2: P1 기능 안정성 + UX (단기)

**보안 (SEC-06 ~ SEC-09)**

| ID | 항목 | 조치 |
|----|------|------|
| SEC-06 | slug 포맷 미검증 | 정규식 검증 추가 |
| SEC-07 | ncv_id 쿠키 보안 속성 | `SameSite=Lax`, `Secure=true` 설정 |
| SEC-08 | metadata 크기 무제한 | JSON 1KB + 깊이 제한 |
| SEC-09 | Admin API rate limiting | KV 기반 rate limit |

**접근성 (ACC-02 ~ ACC-05)**

| ID | 항목 | 조치 |
|----|------|------|
| ACC-02 | 모바일 메뉴 접근성 | `aria-expanded`, focus trap, Escape 핸들러 |
| ACC-03 | BrutalistHeader 모바일 메뉴 | 햄버거 메뉴 추가 |
| ACC-04 | Reaction 게임 키보드 | `onClick`/`onKeyDown` 핸들러 추가 |
| ACC-05 | ScrollReveal reduced motion | `useReducedMotion()` 훅 적용 |

**코드 (CODE-03 ~ CODE-04)**

| ID | 항목 | 조치 |
|----|------|------|
| CODE-03 | Non-null assertion | 방어적 null 체크 |
| CODE-04 | pageview 과다 연산 | threshold 캐싱, 연산 통합 |

**SEO (SEO-01 ~ SEO-03)**

| ID | 항목 | 조치 |
|----|------|------|
| SEO-01 | OG 이미지 전무 | `ImageResponse` 동적 생성 |
| SEO-02 | `<time datetime>` 누락 | `dateTime` 속성 추가 |
| SEO-03 | JSON-LD dateModified 누락 | `dateModified` 필드 추가 |

**프론트엔드 (FE-01 ~ FE-03)**

| ID | 항목 | 조치 |
|----|------|------|
| FE-01 | highlight.js CSS 외부 로드 | 로컬 셀프 호스팅 |
| FE-02 | shiki/rehype-pretty-code 제거 검토 | 런타임 미사용 확인 → 제거 |
| FE-03 | GlassBackground 조건부 로딩 | glass 디자인일 때만 로드 |

**테스트 (TEST-01 계속)**
- API 통합 테스트: `/api/scores`, `/api/posts`

### Phase 3: P2 유지보수성 + 최적화 (중기)

**코드 (CODE-05 ~ CODE-11)**

| ID | 항목 | 조치 |
|----|------|------|
| CODE-05 | getAllPostsAdmin SELECT * | metadata만 조회하는 별도 쿼리 |
| CODE-06 | 리더보드 N+1 쿼리 | `Promise.all` 병렬화 |
| CODE-07 | 중복 API 라우트 | usage/config 통합 |
| CODE-08 | game_sessions 미사용 | 삭제 또는 구현 |
| CODE-09 | 마이그레이션 버전 관리 | 추적 테이블 + 에러 로깅 |
| CODE-10 | 블로그 목록 캐싱/페이지네이션 | Cache-Control + offset/limit |
| CODE-11 | API 응답 형식 통일 | `{ data, error, meta }` 패턴 |

**보안 (SEC-10)**

| ID | 항목 | 조치 |
|----|------|------|
| SEC-10 | pageview rate limiting | IP 기반 rate limit |

**프론트엔드 (FE-04 ~ FE-06)**

| ID | 항목 | 조치 |
|----|------|------|
| FE-04 | 디자인별 컴포넌트 중복 | 공통 구조 추출 + 스타일 분리 |
| FE-05 | 게임 컴포넌트 리팩토링 | 커스텀 훅 추출 |
| FE-06 | @tailwindcss/typography | 수동 .prose-custom 대체 |

**SEO (SEO-04 ~ SEO-06)**

| ID | 항목 | 조치 |
|----|------|------|
| SEO-04 | 사이트맵 lastModified | 빌드 날짜로 고정 |
| SEO-05 | DesignPicker 접근성 | ARIA + 키보드 네비게이션 |
| SEO-06 | 헤더 active link | `usePathname()` active 스타일 |

**테스트 (TEST-01 계속)**
- E2E 테스트: 블로그 읽기, 게임 플레이, Admin CMS 플로우

### Phase 4: P3 문서화 + 선택적 개선 (장기)

**문서 (DOC-01 ~ DOC-02)**

| ID | 항목 | 조치 |
|----|------|------|
| DOC-01 | About 페이지 기술 스택 | 실제 스택과 동기화 |
| DOC-02 | tools/ 컴포넌트 문서화 | CLAUDE.md에 도구 목록 추가 |

**프론트엔드 (FE-07 ~ FE-10)**

| ID | 항목 | 조치 |
|----|------|------|
| FE-07 | optimizePackageImports | framer-motion 트리쉐이킹 |
| FE-08 | Header/Footer 서버 컴포넌트 | 디자인 정보 SSR 처리 검토 |
| FE-09 | Glass gradient 토큰 안전성 | 모든 테마에 기본값 설정 |
| FE-10 | game-content.ts 데이터 분리 | JSON 파일로 분리 |

**SEO (SEO-07 ~ SEO-08)**

| ID | 항목 | 조치 |
|----|------|------|
| SEO-07 | 구조화 데이터 확장 | SearchAction, Person, Article image |
| SEO-08 | 게임 aria-live + Cookie role | `aria-live`, `role="alertdialog"` |

### Out of Scope
- 새로운 기능 개발 (게임 추가, 블로그 기능 확장 등)
- 대규모 아키텍처 변경 (모노레포 구조 변경 등)
- 인프라 변경 (Cloudflare Workers 이외 플랫폼 이전)
- Flutter 모바일 앱 관련

## 3. Dependencies

### 신규 패키지
| Phase | 패키지 | 용도 |
|-------|--------|------|
| 1 | `rehype-sanitize` | Markdown XSS 방지 |
| 1 | `dompurify` + `@types/dompurify` | Admin 미리보기 XSS 방지 |
| 1 | `vitest` | 테스트 프레임워크 |
| 3 | `@tailwindcss/typography` | prose 스타일링 (선택) |

### 제거 패키지 (Phase 1)
- `next-themes` (미사용)
- `next-mdx-remote` (D1 전환 완료)
- `gray-matter` (D1 전환 완료)
- `shiki` + `rehype-pretty-code` (Phase 2에서 확인 후 제거)

### Phase 간 의존성
```
Phase 1: CODE-01(getDB 통합) → CODE-02(API 에러 처리) 순서 필수
Phase 1: SEC-01(rehype-sanitize) ← SEC-02(DOMPurify) 독립 실행 가능
Phase 2: Phase 1 완료 전제 (보안 기반 위에 기능 안정성 구축)
Phase 3: CODE-11(API 응답 통일) → Phase 2의 API 변경 이후 진행
Phase 4: 독립적 (다른 Phase 완료 불요)
```

## 4. Success Criteria

| Phase | 기준 |
|-------|------|
| Phase 1 | 보안 취약점 0건 (SEC-01~05 해결), `getDB()` 단일 소스, 모든 API try-catch, vitest 동작, text-muted WCAG AA 통과 |
| Phase 2 | slug 검증 통과, 쿠키 보안 속성 설정, 모바일 메뉴 접근성 통과, OG 이미지 생성 확인, API 통합 테스트 통과 |
| Phase 3 | API 응답 형식 통일, 리더보드 쿼리 병렬화, 디자인 컴포넌트 공통화 50% 이상, E2E 테스트 주요 플로우 커버 |
| Phase 4 | About 페이지 최신화, tools 문서화, 구조화 데이터 확장 |

## 5. Risk & Mitigation

| 리스크 | 영향 | 완화 |
|--------|------|------|
| rehype-sanitize가 기존 HTML 깨뜨림 | 기존 블로그 글 렌더링 오류 | 기존 글은 이미 DB에 컴파일된 HTML → 새 글만 적용 |
| 미사용 패키지 제거 시 런타임 오류 | 빌드/런타임 실패 | import 검색으로 확인 후 제거, 빌드 테스트 |
| 보안 헤더(CSP)가 기존 기능 차단 | 외부 리소스 로드 실패 | report-only 모드로 먼저 테스트 |
| 디자인 컴포넌트 dynamic import 시 FOUC | 초기 로딩 깜빡임 | loading fallback UI 제공 |
| 대량 변경으로 회귀 버그 | 기존 기능 손상 | Phase별 커밋, feature branch, 각 Phase 완료 후 프리뷰 검증 |

## 6. Implementation Notes

- 각 Phase는 별도 feature branch로 진행 (`feature/quality-p0`, `feature/quality-p1` 등)
- Phase 1 완료 후 main 머지 → Phase 2 시작 패턴
- SEC 항목은 최우선 처리 (보안 취약점은 즉시 배포)
- 테스트는 Phase 1에서 프레임워크 구성 후 매 Phase마다 확대
- 각 ID별로 커밋 메시지에 `[SEC-01]`, `[CODE-01]` 등 태그 사용
