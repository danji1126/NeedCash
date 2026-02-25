# Design: final-checklist (PDCA-8)

> **Feature**: final-checklist (최종 점검 + AdSense 재신청 준비)
> **Plan 문서**: `docs/01-plan/features/final-checklist.plan.md`
> **작성일**: 2026-02-25

---

## 1. 설계 방침

이 PDCA는 **검증 중심**이며 코드 변경은 최소화한다. Plan의 FR-01~FR-07을 구체적인 검증 항목으로 분해하고, 각 항목의 PASS/FAIL 기준을 명확히 정의한다.

**설계 결정**:
- FR-07 (Lighthouse 수동 검증)은 자동화 범위 밖이므로 Design 검증 항목에서 제외
- FR-06 (canonical URL)은 사전 조사 결과 `metadataBase`가 이미 설정되어 있어 검증만 수행
- 각 FR의 검증 항목은 코드/파일 기반으로 자동 확인 가능한 것만 포함

---

## 2. 검증 항목 정의 (총 25개)

### FR-01: 빌드 + 린트 무결성 (3개)

| # | 검증 항목 | 검증 방법 | PASS 기준 |
|---|----------|----------|----------|
| 1 | `pnpm build` 성공 | 빌드 실행 | exit code 0, 0 errors |
| 2 | `pnpm lint` 통과 | 린트 실행 | 0 errors, 0 warnings |
| 3 | 정적 페이지 수 32개 이상 | 빌드 출력에서 페이지 수 확인 | ≥ 32 pages |

### FR-02: 콘텐츠 품질 (5개)

| # | 검증 항목 | 검증 방법 | PASS 기준 |
|---|----------|----------|----------|
| 4 | 블로그 MDX 파일 10개 | `ls content/blog/*.mdx \| wc -l` | = 10 |
| 5 | 게임 데이터 6개 | `game-content.ts`에서 `gameContents` 배열 길이 | = 6 (reaction, color-sense, color-memory, dice, lotto, animal-face) |
| 6 | 카테고리 tech 4개 | MDX frontmatter `category: "tech"` 개수 | = 4 |
| 7 | 카테고리 review 3개 | MDX frontmatter `category: "review"` 개수 | = 3 |
| 8 | 카테고리 science 3개 | MDX frontmatter `category: "science"` 개수 | = 3 |

### FR-03: 기술 SEO (7개)

| # | 검증 항목 | 검증 방법 | PASS 기준 |
|---|----------|----------|----------|
| 9 | `app/sitemap.ts` 존재 | 파일 존재 확인 | 파일 존재 |
| 10 | sitemap에 블로그/게임/정적 경로 포함 | sitemap.ts 코드에서 `blogPages`, `gamePages`, `staticPages` 확인 | 3개 배열 모두 존재 |
| 11 | `app/robots.ts` 존재 + Allow: / | 파일 존재 + `allow: "/"` 확인 | 파일 존재 + allow 설정 |
| 12 | `components/seo/json-ld.tsx` 존재 | 파일 존재 확인 | WebSiteJsonLd, ArticleJsonLd, GameJsonLd 함수 존재 |
| 13 | blog/[slug]/page.tsx에서 ArticleJsonLd 사용 | import 및 렌더링 확인 | ArticleJsonLd 호출 존재 |
| 14 | game/[slug]/page.tsx에서 GameJsonLd 사용 | import 및 렌더링 확인 | GameJsonLd 호출 존재 |
| 15 | `metadataBase` 설정 | layout.tsx에서 `metadataBase: new URL(...)` 확인 | 설정 존재 |

### FR-04: 정책 준수 (6개)

| # | 검증 항목 | 검증 방법 | PASS 기준 |
|---|----------|----------|----------|
| 16 | `app/ads/` 디렉토리 없음 | 디렉토리 존재 확인 | 디렉토리 부재 |
| 17 | `app/privacy/page.tsx` 존재 | 파일 존재 확인 | 파일 존재 |
| 18 | `app/terms/page.tsx` 존재 | 파일 존재 확인 | 파일 존재 |
| 19 | `app/about/page.tsx` 존재 | 파일 존재 확인 | 파일 존재 |
| 20 | `cookie-consent.tsx` 존재 | 파일 존재 확인 | 파일 존재 |
| 21 | AdSense 메타 태그 | layout.tsx에 `google-adsense-account` | 값 존재 |

### FR-05: 내부 링크 무결성 (4개)

| # | 검증 항목 | 검증 방법 | PASS 기준 |
|---|----------|----------|----------|
| 22 | relatedBlog 3개 게임 설정 | `game-content.ts`에서 relatedBlog 필드 확인 | reaction, color-sense, color-memory에 존재 |
| 23 | relatedBlog slug ↔ 실제 MDX 일치 | slug 값이 `content/blog/` 내 파일명과 일치 | reaction-speed-science, color-sense-guide, color-memory-science 모두 일치 |
| 24 | RelatedPosts category prop | `related-posts.tsx`에 `category?: string` prop | prop 존재 + 카테고리 우선 정렬 로직 |
| 25 | hreflang 설정 (이력서) | `resume/[lang]/page.tsx`에 `alternates.languages` | SUPPORTED_LANGUAGES 전체 + x-default |

---

## 3. 검증 코드 없는 페이지별 metadata 확인

| 페이지 | metadata 소스 | 비고 |
|--------|-------------|------|
| `/` (홈) | layout.tsx 기본값 상속 | title: SITE.name, description: SITE.description |
| `/about` | about/page.tsx `metadata` export | 고유 title, description |
| `/blog` | blog/page.tsx `metadata` export | 고유 title, description |
| `/blog/[slug]` | blog/[slug]/page.tsx `generateMetadata` | 동적 title, description, OG |
| `/game` | game/page.tsx `metadata` export | 고유 title, description |
| `/game/[slug]` | game/[slug]/page.tsx `generateMetadata` | 동적 title, description, OG |
| `/privacy` | privacy/page.tsx `metadata` export | 고유 title |
| `/terms` | terms/page.tsx `metadata` export | 고유 title |
| `/resume` | resume/page.tsx `metadata` export | 고유 title |
| `/resume/[lang]` | resume/[lang]/page.tsx `generateMetadata` | 동적 + hreflang |

모든 페이지가 metadata를 보유하고 있음 확인. 홈페이지는 layout.tsx 기본값을 상속하므로 별도 설정 불필요.

---

## 4. 구현 순서

이 PDCA는 검증 작업이므로 구현보다 **검증 실행 순서**를 정의한다.

| 순서 | 작업 | FR | 소요 |
|------|------|----|------|
| 1 | `pnpm build` + `pnpm lint` 실행 | FR-01 | 자동 |
| 2 | 파일 존재/개수 확인 (MDX, page.tsx, 컴포넌트) | FR-02, FR-04 | 자동 |
| 3 | 코드 레벨 검증 (sitemap, robots, JSON-LD, metadata, 내부 링크) | FR-03, FR-05 | 자동 |
| 4 | 미비 사항 발견 시 수정 | ALL | 조건부 |

---

## 5. 예상 변경 파일

이 Design의 검증 결과에 따라 **변경이 필요 없을 수 있음**.

사전 조사 결과:
- `metadataBase`: ✅ 이미 설정됨 (`layout.tsx:38`)
- `hreflang`: ✅ 이미 설정됨 (`resume/[lang]/page.tsx:39-48`)
- `canonical`: ✅ Next.js가 `metadataBase` 기반 자동 생성

**코드 변경 예상: 0개 파일** (모든 항목이 이미 구현됨)

---

## 6. 제약 사항

| 항목 | 설명 |
|------|------|
| Lighthouse 검증 | 배포 후 수동 확인 필요 (Design 범위 밖) |
| Google Search Console | 배포 환경에서만 설정 가능 |
| 실제 AdSense 재신청 | Google 계정으로 수동 수행 |
| 블로그 글 수 (10개 vs 15개) | 현재 10개. 추가 작성은 별도 PDCA |
