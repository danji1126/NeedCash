# NeedCash 개선 사항 통합 보고서

> 분석일: 2026-03-10
> 대상: needcash.dev (139개 파일, ~13,134줄)
> 분석 팀: 프론트엔드, 백엔드, 보안/품질, SEO/UX (4개 팀 결과 통합)

---

## 요약 통계

| 우선순위 | 항목 수 | 설명 |
|----------|---------|------|
| **P0 (즉시)** | 12 | 보안 취약점, 접근성 위반, 코드 품질 기반 |
| **P1 (단기)** | 16 | 기능 안정성, UX 개선, 성능 최적화 |
| **P2 (중기)** | 15 | 유지보수성, SEO 강화, 코드 정리 |
| **P3 (장기)** | 8 | 문서화, 선택적 리팩토링 |
| **합계** | **51** | |

---

## P0 -- 즉시 조치 (보안/안정성 위험)

### SEC-01. Stored XSS 방지 -- `rehype-sanitize` 추가
- **파일**: `lib/compile-markdown.ts:13`
- **현황**: `allowDangerousHtml: true` + `rehypeRaw` 조합으로 Markdown에 삽입된 임의 HTML(`<script>` 포함)이 그대로 컴파일됨
- **영향**: Admin이 작성한 블로그 글에 악성 스크립트 삽입 가능 → 모든 방문자에게 Stored XSS 실행
- **조치**: `.use(rehypeSanitize)` 파이프라인에 추가
- **담당**: 보안

### SEC-02. Admin 미리보기 XSS -- DOMPurify 적용
- **파일**: `components/admin/markdown-editor.tsx:32-34, 93`
- **현황**: `marked.parse()` 결과를 `dangerouslySetInnerHTML`로 직접 렌더링
- **영향**: Self-XSS (Admin 본인), 공유 Admin 환경에서 위험 확대
- **조치**: DOMPurify로 HTML sanitize 후 렌더링
- **담당**: 보안

### SEC-03. 하드코딩 시크릿 폴백 제거
- **파일**: `lib/auth.ts:8`
- **현황**: `process.env.ADMIN_API_KEY ?? "dev-secret-key"` → 환경변수 미설정 시 고정키로 인증 통과
- **영향**: 프로덕션에서 환경변수 누락 시 누구나 Admin 인증 가능
- **조치**: 폴백 제거, 환경변수 없으면 인증 실패 처리
- **담당**: 보안

### SEC-04. 보안 헤더 미설정
- **파일**: `next.config.ts` (현재 완전 비어있음 `{}`)
- **현황**: CSP, X-Frame-Options, X-Content-Type-Options, HSTS 등 보안 헤더가 전혀 없음
- **영향**: XSS 영향 범위 확대, clickjacking 가능, MIME 스니핑 위험
- **조치**: `next.config.ts`의 `headers()` 또는 `middleware.ts`에서 보안 헤더 설정
- **담당**: 보안/프론트엔드

### ACC-01. text-muted 색상 대비 WCAG AA 미달
- **파일**: `app/globals.css` (테마 정의 전체)
- **현황**: 다수 다크 테마에서 `text-muted` 색상이 WCAG AA 4.5:1 기준 미달
  - brutal-terminal: `#3D6A3D` on `#0A0E0A` → ~2.5:1
  - editorial-dark: `#666666` on `#0a0a0a` → ~3.9:1
  - glass-aurora: `#6060A0` on `#0A0A1A` → ~3.0:1
  - glass-ocean: `#3D5A73` on `#0A1628` → ~2.8:1
- **영향**: 날짜, 라벨, 보조 텍스트가 저시력 사용자에게 읽기 어려움
- **조치**: `text-muted` 밝기를 각 테마에서 4.5:1 이상으로 조정
- **담당**: SEO/UX

### UX-01. loading.tsx / error.tsx 전무
- **파일**: `app/` 전체 디렉토리
- **현황**: Next.js의 `loading.tsx`, `error.tsx` 파일이 하나도 없음
- **영향**: D1 SSR 페이지 이동 시 로딩 피드백 없음, 에러 발생 시 기본 500 페이지 노출
- **조치**: 최소 루트 레벨에 `loading.tsx` + `error.tsx` 추가, 주요 라우트별로도 추가
- **담당**: 프론트엔드/SEO/UX

### CODE-01. `getDB()` 4곳 중복
- **파일**: `lib/db.ts:58`, `lib/scores.ts:141`, `lib/analytics.ts:105`, `app/api/admin/scores/[game]/route.ts:5`
- **현황**: 동일한 환경 분기 로직이 4곳에 복사-붙여넣기
- **영향**: 수정 시 4곳 모두 변경 필요, 누락 시 불일치, `eslint-disable` 주석도 4곳 중복
- **조치**: `lib/env.ts` 공통 모듈 생성 → `getDB()`, `getKV()` 단일 소스
- **담당**: 백엔드

### CODE-02. API 에러 처리 부재
- **파일**: `app/api/` 하위 11개 `route.ts`
- **현황**: 11개 API 라우트 중 try-catch 사용은 1곳 (`pageview`)뿐. `request.json()` 파싱 실패 시 unhandled rejection
- **영향**: 잘못된 JSON, DB 에러(중복 slug 등) 시 스택 트레이스가 500 응답으로 노출
- **조치**: 모든 API 라우트에 try-catch + 일관된 에러 응답 `{ error: string }` 형식
- **담당**: 백엔드

### BUNDLE-01. 미사용 의존성 3개
- **파일**: `package.json`
- **현황**:
  - `next-themes`: import 0건 (DesignProvider가 자체 구현으로 대체)
  - `next-mdx-remote`: D1 전환 완료 후 미사용 추정
  - `gray-matter`: MDX frontmatter 파싱용, D1 전환 후 불필요
- **영향**: 불필요한 node_modules, 공급망 공격 표면 증가
- **조치**: `pnpm remove next-themes next-mdx-remote gray-matter`
- **담당**: 프론트엔드

### BUNDLE-02. 디자인 변형 컴포넌트 정적 import
- **파일**: `components/layout/header.tsx`, `footer.tsx`, `home-page.tsx`
- **현황**: Header/Footer/Hero/Grid/Posts 4종이 모두 정적 import → 선택되지 않은 3개 디자인 코드도 번들에 포함 (24개 파일)
- **영향**: 클라이언트 번들 약 4배 불필요 증가
- **조치**: `next/dynamic`으로 디자인 변형 lazy loading (게임 컴포넌트와 동일 패턴)
- **담당**: 프론트엔드

### TEST-01. 테스트 코드 전무
- **파일**: 프로젝트 전체
- **현황**: 단위 테스트, 통합 테스트, E2E 테스트가 하나도 없음 (0%)
- **영향**: 리팩토링/기능 추가 시 회귀 버그 탐지 불가, 배포 신뢰도 저하
- **테스트 프레임워크 구성 필요**: `vitest` 또는 `jest` 도입
- **우선 테스트 대상** (순수 함수, 테스트 작성 용이):

| 파일 | 테스트 대상 | 이유 |
|------|------------|------|
| `lib/score-validation.ts` | `validateScore()`, `validateNickname()`, `isRankableGame()` | 순수 함수, 게임 무결성 핵심 |
| `lib/compile-markdown.ts` | `compileMarkdown()`, `calculateReadingTime()` | 블로그 핵심 기능, 입출력 명확 |
| `lib/auth.ts` | `verifyAdminAuth()` | 인증 로직, 엣지 케이스 검증 |
| `lib/db.ts` | CRUD 함수 (getAllPosts, createPost 등) | 로컬 SQLite로 실제 DB 테스트 가능 |
| `lib/analytics.ts` | `incrementCounter()`, `checkAutoBlock()` | 통계 수집 정확성 |

- **API 통합 테스트 대상**:

| 엔드포인트 | 테스트 시나리오 |
|-----------|---------------|
| `POST /api/scores` | 유효/무효 점수, rate limit, 닉네임 검증 |
| `POST /api/posts` | 인증 실패, 필수 필드 누락, 중복 slug |
| `GET /api/scores/[game]` | 존재/미존재 게임, 리더보드 정렬 |

- **E2E 테스트 대상** (Playwright):

| 플로우 | 시나리오 |
|--------|---------|
| 블로그 읽기 | 목록 → 상세 → TOC 네비게이션 |
| 게임 플레이 | 게임 시작 → 점수 제출 → 리더보드 확인 |
| Admin CMS | 로그인 → 포스트 생성 → 미리보기 → 발행 |
| 디자인 전환 | 테마 변경 → 새로고침 후 유지 확인 |

- **조치**: 테스트 환경 구성 → 순수 함수 단위 테스트부터 시작 → API 통합 테스트 → E2E
- **담당**: 전체

### SEC-05. timing-unsafe 토큰 비교
- **파일**: `lib/auth.ts:14`
- **현황**: `token === env.ADMIN_API_KEY` → `===` 연산자는 constant-time이 아님
- **영향**: 응답 시간 차이 측정으로 토큰 바이트 단위 추론 가능 (Cloudflare 네트워크 지터가 일부 완화)
- **조치**: `crypto.subtle.timingSafeEqual()` 사용 또는 HMAC 비교
- **담당**: 보안

---

## P1 -- 단기 조치 (기능 안정성, UX 개선)

### SEC-06. slug 포맷 미검증
- **파일**: `app/api/posts/route.ts:14-26`
- **현황**: `POST /api/posts`에서 slug 필드에 특수문자, 경로순회(`../`) 등 제한 없음
- **조치**: `/^[a-z0-9]+(-[a-z0-9]+)*$/` 같은 정규식 검증 추가
- **담당**: 백엔드

### SEC-07. ncv_id 쿠키 보안 속성 확인
- **파일**: `lib/visitor.ts`
- **현황**: HttpOnly ✅, `SameSite`/`Secure` 속성 미확인
- **조치**: `SameSite=Lax`, `Secure=true` 명시적 설정
- **담당**: 보안

### SEC-08. metadata 필드 크기 무제한
- **파일**: `app/api/scores/route.ts`, `lib/scores.ts`
- **현황**: `metadata: Record<string, unknown>`이 크기/깊이 검증 없이 JSON.stringify 후 DB 저장
- **조치**: JSON 크기 1KB 제한 + 깊이 제한
- **담당**: 백엔드

### SEC-09. Admin API rate limiting 없음
- **파일**: Admin API 전체
- **현황**: brute force 요청 제한 없음
- **조치**: KV 기반 또는 Cloudflare Rate Limiting 적용
- **담당**: 백엔드

### CODE-03. Non-null assertion 사용
- **파일**: `lib/db.ts:161`, `lib/scores.ts:55,118`
- **현황**: `row!.id`, `countRow!.total` 등 DB 결과에 non-null assertion
- **조치**: 방어적 null 체크 + 적절한 에러 응답
- **담당**: 백엔드

### CODE-04. pageview 엔드포인트 과다 연산
- **파일**: `app/api/analytics/pageview/route.ts`
- **현황**: 요청당 6회 DB/KV 연산 (incrementCounter 2 + getUsage 2 + checkAutoBlock 2)
- **조치**: threshold를 KV에서 캐싱, getUsage와 checkAutoBlock 통합
- **담당**: 백엔드

### ACC-02. 모바일 메뉴 접근성 미흡
- **파일**: `components/layout/header/editorial-header.tsx`, `bento-header.tsx`, `glass-header.tsx`
- **현황**: `aria-expanded` 누락, focus trap 없음, Escape 키 닫기 미지원
- **조치**: `aria-expanded={menuOpen}`, `aria-controls` 추가, focus trap + Escape 핸들러
- **담당**: SEO/UX

### ACC-03. BrutalistHeader 모바일 메뉴 부재
- **파일**: `components/layout/header/brutalist-header.tsx`
- **현황**: 4개 헤더 중 유일하게 햄버거 메뉴 없음 → 좁은 화면에서 네비게이션 불편
- **조치**: 다른 3개 헤더와 동일하게 모바일 메뉴 추가
- **담당**: 프론트엔드

### ACC-04. Reaction 게임 키보드 접근 불가
- **파일**: `components/game/reaction-game.tsx:298-394`
- **현황**: 게임 오버레이에서 `onPointerDown` 사용 → 키보드 유저 완전 차단, 닫기 버튼도 `onPointerDown`
- **조치**: `onClick` 또는 `onKeyDown` 핸들러 추가
- **담당**: 프론트엔드

### ACC-05. ScrollReveal + reduced motion
- **파일**: `components/ui/scroll-reveal.tsx`
- **현황**: framer-motion은 CSS animation이 아닌 JS → `globals.css`의 `prefers-reduced-motion` 미적용, 콘텐츠가 invisible(`opacity: 0`)로 남을 수 있음
- **조치**: framer-motion의 `useReducedMotion()` 훅으로 reduced motion 시 즉시 표시
- **담당**: 프론트엔드

### SEO-01. OG 이미지 전무
- **파일**: `app/layout.tsx`, 모든 페이지 metadata
- **현황**: `openGraph.images` 미설정 → 소셜 공유 시 미리보기 이미지 없음
- **조치**: Next.js `opengraph-image.tsx` 또는 `ImageResponse`로 동적 OG 이미지 생성
- **담당**: SEO/UX

### SEO-02. `<time datetime>` 속성 누락
- **파일**: `app/blog/[slug]/page.tsx:72`
- **현황**: `<time>` 요소에 `datetime` 속성 없음
- **조치**: `<time dateTime={post.date}>` 추가
- **담당**: SEO/UX

### SEO-03. Article JSON-LD `dateModified` 누락
- **파일**: `components/seo/json-ld.tsx`
- **현황**: `post.updatedAt` 데이터가 존재하나 JSON-LD에 미포함
- **조치**: `dateModified: post.updatedAt || post.date` 추가
- **담당**: SEO/UX

### FE-01. highlight.js CSS 셀프 호스팅
- **파일**: `app/layout.tsx:87-89`
- **현황**: `cdnjs.cloudflare.com`에서 외부 로드 → 렌더링 차단 리소스, 외부 의존성
- **조치**: CSS 파일을 로컬로 포함하거나 `@import`로 번들링
- **담당**: 프론트엔드

### FE-02. shiki/rehype-pretty-code 제거 검토
- **파일**: `package.json`
- **현황**: 레거시 블로그 글 전용 (~5MB). 기존 글의 HTML이 이미 DB에 저장되어 있으므로 런타임 불필요 가능
- **조치**: shiki가 런타임에 사용되는지 확인 → 미사용 시 제거
- **담당**: 프론트엔드

### FE-03. GlassBackground 조건부 로딩
- **파일**: `app/layout.tsx:107`
- **현황**: 루트 레이아웃에서 모든 디자인에서 `<GlassBackground />` 마운트
- **조치**: glass 디자인일 때만 `next/dynamic`으로 조건부 로드
- **담당**: 프론트엔드

---

## P2 -- 중기 조치 (유지보수성, SEO 강화)

### CODE-05. getAllPostsAdmin SELECT * 과다 조회
- **파일**: `lib/db.ts:121-127`
- **현황**: Admin 리스트에서 `SELECT *`로 HTML 포함 전체 데이터 반환
- **조치**: 리스트용 metadata만 조회하는 별도 쿼리 사용
- **담당**: 백엔드

### CODE-06. 리더보드 N+1 쿼리
- **파일**: `lib/scores.ts:58-118`
- **현황**: leaderboard, count, myRank 3개 쿼리 순차 실행
- **조치**: count + myRank를 `Promise.all`로 병렬화
- **담당**: 백엔드

### CODE-07. 중복 API 라우트 정리
- **파일**: `app/api/admin/analytics/usage/route.ts`, `app/api/admin/analytics/config/route.ts`
- **현황**: 두 엔드포인트가 기능적으로 중복
- **조치**: 하나로 통합
- **담당**: 백엔드

### CODE-08. game_sessions 미사용 테이블
- **파일**: `migrations/0003_create_analytics.sql`
- **현황**: 스키마 정의만 존재, 코드에서 미참조
- **조치**: 삭제 또는 anti-cheat 기능 구현
- **담당**: 백엔드

### CODE-09. DB 마이그레이션 버전 관리
- **파일**: `lib/local-db.ts:84-102`
- **현황**: 에러를 빈 catch로 무시 → 실제 마이그레이션 실패도 숨김
- **조치**: 마이그레이션 추적 테이블 + 선택적 에러 로깅
- **담당**: 백엔드

### CODE-10. 블로그 목록 API 개선
- **파일**: `app/api/posts/route.ts`, `lib/db.ts:70-82`
- **현황**: Cache-Control 없음, 페이지네이션 없음 (전체 반환)
- **조치**: `Cache-Control: s-maxage=60` 추가 + offset/limit 파라미터 지원
- **담당**: 백엔드

### CODE-11. API 응답 형식 통일
- **파일**: 모든 API route.ts
- **현황**: 성공/실패 응답 형식이 비일관적
- **조치**: `{ data, error, meta }` 패턴 통일
- **담당**: 백엔드

### SEC-10. pageview rate limiting
- **파일**: `app/api/analytics/pageview/route.ts`
- **현황**: 인증/rate limit 없이 무한 요청 가능 → auto-block 강제 트리거로 통계 수집 방해
- **조치**: IP 기반 rate limiting 추가
- **담당**: 보안

### FE-04. 디자인별 컴포넌트 중복 축소
- **파일**: `components/layout/` 하위 24개 파일
- **현황**: Header 4개, Footer 4개, Hero 4개, Grid 4개, Posts 4개 → 유사 구조 반복
- **조치**: 공통 구조를 추출하고 디자인별 스타일/변형만 props/CSS로 분리
- **담당**: 프론트엔드

### FE-05. 게임 컴포넌트 리팩토링
- **파일**: `components/game/` (400-700줄 단일 파일들)
- **현황**: animal-face 732줄, math-game 496줄, color-sense 470줄 등 상태/UI/로직 혼재
- **조치**: `useGameTimer`, `useScoreTracking` 등 커스텀 훅 추출
- **담당**: 프론트엔드

### FE-06. @tailwindcss/typography 도입
- **파일**: `app/globals.css` (.prose-custom 섹션)
- **현황**: 20+ 규칙이 수동 작성
- **조치**: 공식 typography 플러그인으로 대체하여 유지보수 부담 감소
- **담당**: 프론트엔드

### SEO-04. 사이트맵 lastModified 수정
- **파일**: `app/sitemap.ts:28-52`
- **현황**: 게임/이력서 페이지에 `new Date()` 사용 → 매 크롤링마다 "오늘"로 보고
- **조치**: 최종 수정일 또는 빌드 날짜로 고정
- **담당**: SEO/UX

### SEO-05. DesignPicker 접근성
- **파일**: `components/design/design-picker.tsx`
- **현황**: `aria-expanded` 없음, Escape 키 닫기 없음, 테마 스와치 텍스트 라벨 없음
- **조치**: ARIA 속성 추가 + 키보드 네비게이션 지원
- **담당**: SEO/UX

### SEO-06. 헤더 active link indicator
- **파일**: 4개 헤더 컴포넌트 전체
- **현황**: 현재 페이지 표시 없음 → 사용자가 어디에 있는지 시각적 단서 부재
- **조치**: `usePathname()`으로 현재 경로 비교 → active 스타일 적용
- **담당**: SEO/UX

---

## P3 -- 장기 조치 (문서화, 선택적 리팩토링)

### DOC-01. About 페이지 기술 스택 업데이트
- **파일**: `app/about/page.tsx:79-85`
- **현황**: "Next.js 15" → 실제 16, "Static Export" → Workers, "MDX" → D1, "Cloudflare Pages" → Workers
- **조치**: 실제 기술 스택과 동기화
- **담당**: 전체

### DOC-02. tools/ 컴포넌트 문서화
- **파일**: `components/tools/` (json-formatter, base64-tool, color-palette, sort-visualizer)
- **현황**: CLAUDE.md에 미문서화
- **조치**: CLAUDE.md의 프로젝트 구조 + 게임 목록 형식으로 도구 목록 추가
- **담당**: 전체

### FE-07. next.config.ts optimizePackageImports
- **파일**: `next.config.ts`
- **현황**: framer-motion의 트리쉐이킹이 완전하지 않을 수 있음
- **조치**: `experimental.optimizePackageImports: ['framer-motion']` 추가
- **담당**: 프론트엔드

### FE-08. Header/Footer 서버 컴포넌트 전환 검토
- **파일**: `components/layout/header.tsx`, `footer.tsx`
- **현황**: `useDesign()` 호출 때문에 "use client" 필수
- **조치**: 디자인 정보를 쿠키/서버에서 읽어 SSR 처리 가능한지 검토
- **담당**: 프론트엔드

### FE-09. Glass gradient 토큰 안전성
- **파일**: `app/globals.css`
- **현황**: `--gradient-1/2/3`이 glass 테마에만 정의 → 다른 테마에서 참조 시 undefined
- **조치**: 모든 테마에 기본값 설정 또는 glass 전용 체크 추가
- **담당**: 프론트엔드

### FE-10. game-content.ts 데이터 분리
- **파일**: `lib/game-content.ts` (437줄)
- **현황**: 순수 문자열 데이터가 TypeScript 코드로 관리됨
- **조치**: JSON 파일로 분리 검토
- **담당**: 프론트엔드

### SEO-07. 구조화 데이터 확장
- **파일**: `components/seo/json-ld.tsx`
- **현황**: WebSite에 `SearchAction` 없음, 이력서에 `Person` 스키마 없음, Article에 `image` 없음
- **조치**: SearchAction, Person JSON-LD, Article image 추가
- **담당**: SEO/UX

### SEO-08. 게임 aria-live + Cookie consent role
- **파일**: `components/game/reaction-game.tsx` 등, `components/ui/cookie-consent.tsx`
- **현황**: 게임 상태 변경 시 스크린리더 알림 없음, 쿠키 배너에 `role` 없음
- **조치**: `aria-live="polite"` 영역 추가, `role="alertdialog"` 설정
- **담당**: SEO/UX

---

## 개선 로드맵 제안

```
Phase 1 (1주) ── P0 보안 + 코드 기반
├── SEC-01~05: XSS 방지, 시크릿 폴백, 보안 헤더, timing-safe
├── CODE-01~02: getDB() 통합, API 에러 처리
├── BUNDLE-01~02: 미사용 의존성 제거, lazy loading
└── TEST-01: 테스트 프레임워크 구성 + score-validation 테스트

Phase 2 (2주) ── P0 접근성/UX + P1 핵심
├── ACC-01: text-muted 대비 수정
├── UX-01: loading.tsx / error.tsx 추가
├── ACC-02~05: 모바일 메뉴, 키보드 접근성, reduced motion
├── SEO-01~03: OG 이미지, datetime, JSON-LD
├── TEST-01 계속: API 통합 테스트 추가
└── FE-01~03: highlight.js, shiki 정리, GlassBackground

Phase 3 (3-4주) ── P2 유지보수 + 최적화
├── CODE-05~11: DB 쿼리 최적화, API 정리, 캐싱
├── FE-04~06: 컴포넌트 중복 축소, 게임 리팩토링
├── SEO-04~06: 사이트맵, DesignPicker, active link
└── TEST-01 계속: E2E 테스트 추가

Phase 4 (이후) ── P3 문서화 + 선택적 개선
├── DOC-01~02: About 페이지, tools 문서화
├── FE-07~10: next.config 최적화, 데이터 분리
└── SEO-07~08: 구조화 데이터 확장
```
