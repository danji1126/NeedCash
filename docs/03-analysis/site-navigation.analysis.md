# Gap Analysis: site-navigation (PDCA-4)

> **Feature**: site-navigation
> **Design 문서**: `docs/02-design/features/site-navigation.design.md`
> **분석일**: 2026-02-25
> **Match Rate**: 100% (12/12 검증 항목 통과)

---

## 1. FR별 Gap 분석

### FR-01: Breadcrumb 컴포넌트 ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 파일 위치 | `components/ui/breadcrumb.tsx` CREATE | 존재 | ✅ |
| 서버 컴포넌트 | `"use client"` 없음 | 없음 확인 | ✅ |
| BreadcrumbItem interface | `label: string, href?: string` | 동일 (lines 3-6) | ✅ |
| `<nav aria-label="breadcrumb">` | 시맨틱 마크업 | 동일 (line 14) | ✅ |
| `<ol>` 순서 리스트 | 리스트 마크업 | 동일 (line 15) | ✅ |
| 구분자 `/` | `aria-hidden="true"` | 동일 (line 19) | ✅ |
| 마지막 항목 | `aria-current="page"` + `text-text-secondary` | 동일 (line 29) | ✅ |
| 링크 항목 | `<Link href>` + `hover:opacity-50` | 동일 (lines 22-27) | ✅ |

### FR-02: BreadcrumbList JSON-LD ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 파일 위치 | `components/seo/json-ld.tsx` EDIT | 수정됨 (lines 99-128) | ✅ |
| BreadcrumbJsonLdItem interface | `name: string, href: string` | 동일 (lines 101-104) | ✅ |
| `@type: BreadcrumbList` | Schema.org 스펙 | 동일 (line 113) | ✅ |
| `position` 1-indexed | `i + 1` | 동일 (line 116) | ✅ |
| `item` 전체 URL | `${SITE.url}${item.href}` | 동일 (line 118) | ✅ |
| `<script type="application/ld+json">` | JSON-LD 출력 | 동일 (lines 123-126) | ✅ |

### FR-03: Footer 내부 링크 강화 ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| `FOOTER_SECTIONS` in constants.ts | 3개 섹션 (콘텐츠/게임/정보) | 동일 (lines 13-41) | ✅ |
| 콘텐츠 섹션 | Blog, Game, Resume (3개) | 동일 | ✅ |
| 게임 섹션 | 6개 게임 개별 링크 | 동일 | ✅ |
| 정보 섹션 | About, Privacy, Terms (3개) | 동일 | ✅ |
| editorial-footer | `FOOTER_SECTIONS` + 3-column grid + copyright | 동일 | ✅ |
| brutalist-footer | `FOOTER_SECTIONS` + 3-column grid + mono + uppercase | 동일 | ✅ |
| bento-footer | `FOOTER_SECTIONS` + 3-column grid + 깔끔한 스타일 | 동일 | ✅ |
| glass-footer | `FOOTER_SECTIONS` + 3-column grid + font-light | 동일 | ✅ |
| 총 링크 수 | 12개 (3 + 6 + 3) | 12개 확인 | ✅ |

### FR-04: 블로그 관련 포스트 ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| 파일 위치 | `components/blog/related-posts.tsx` CREATE | 존재 | ✅ |
| 서버 컴포넌트 | `"use client"` 없음 | 없음 확인 | ✅ |
| `getAllPosts()` 필터링 | `currentSlug` 제외 + `slice(0, 3)` | 동일 (lines 9-11) | ✅ |
| H2 제목 | "다른 글도 읽어보세요" | 동일 (line 19) | ✅ |
| 카드 UI | `rounded-lg border` + `hover:bg-bg-secondary` | 동일 (line 26) | ✅ |
| 포스트 정보 | `title` + arrow + `description` (line-clamp-2) | 동일 (lines 28-36) | ✅ |
| 구분선 | `mx-auto h-px max-w-xs bg-border/60` | 동일 (line 17) | ✅ |
| 3-column grid | `grid gap-3 sm:grid-cols-3` | 동일 (line 21) | ✅ |

### FR-05: 페이지별 통합 ✅ 100%

| 항목 | Design | Implementation | 일치 |
|------|--------|---------------|------|
| game/[slug] import | `BreadcrumbJsonLd`, `Breadcrumb` | 동일 (lines 6-7) | ✅ |
| game/[slug] Breadcrumb | 홈 > 게임 > {title} | 동일 (lines 89-95) | ✅ |
| game/[slug] JSON-LD | 홈 > 게임 > {title} | 동일 (lines 82-88) | ✅ |
| game/[slug] Back 링크 제거 | `<Link href="/game">` 교체 | `Link` import 제거됨 | ✅ |
| blog/[slug] import | `BreadcrumbJsonLd`, `Breadcrumb`, `RelatedPosts` | 동일 (lines 9-11) | ✅ |
| blog/[slug] Breadcrumb | 홈 > 블로그 > {title} | 동일 (lines 60-66) | ✅ |
| blog/[slug] JSON-LD | 홈 > 블로그 > {title} | 동일 (lines 53-59) | ✅ |
| blog/[slug] Back 링크 제거 | `<Link href="/blog">` 교체 | `Link` import 제거됨 | ✅ |
| blog/[slug] RelatedPosts | `</article>` 직전 | 동일 (line 115) | ✅ |
| game/page Breadcrumb | 홈 > 게임 | 동일 (lines 21-26) | ✅ |
| blog/page Breadcrumb | 홈 > 블로그 | 동일 (lines 22-27) | ✅ |

---

## 2. 검증 체크리스트

| # | 항목 | 결과 |
|---|------|------|
| 1 | `pnpm build` 성공 (0 errors) | ✅ 29 pages |
| 2 | `pnpm lint` 통과 (0 warnings) | ✅ |
| 3 | 게임 상세 6페이지: `<nav aria-label="breadcrumb">` 존재 | ✅ 6/6 |
| 4 | 블로그 상세 7페이지: `<nav aria-label="breadcrumb">` 존재 | ✅ 7/7 |
| 5 | 게임 목록 1페이지: `<nav aria-label="breadcrumb">` 존재 | ✅ |
| 6 | 블로그 목록 1페이지: `<nav aria-label="breadcrumb">` 존재 | ✅ |
| 7 | 게임 상세 6페이지: `BreadcrumbList` JSON-LD 존재 | ✅ 6/6 |
| 8 | 블로그 상세 7페이지: `BreadcrumbList` JSON-LD 존재 | ✅ 7/7 |
| 9 | Footer 12개+ 내부 링크 (4개 디자인 공통) | ✅ 12개 |
| 10 | 블로그 상세 7페이지: "다른 글도 읽어보세요" + 3개 링크 | ✅ 7/7 |
| 11 | `aria-current="page"` breadcrumb 마지막 항목 | ✅ 모든 페이지 |
| 12 | BreadcrumbList JSON-LD `position` 1-indexed | ✅ (1, 2, 3 확인) |

**통과율**: 12/12 = **100%**

---

## 3. Gap 요약

| Gap ID | FR | 심각도 | 설명 |
|--------|-----|--------|------|
| (없음) | - | - | 모든 항목 일치 |

---

## 4. 결론

- **Match Rate**: 100% (≥ 90% 기준 충족)
- **Gap**: 0건
- **권장**: Report 단계 진행 가능
