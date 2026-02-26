# Gap Analysis: blog-db-migration

**Date**: 2026-02-26
**Design Document**: `docs/02-design/features/blog-db-migration.design.md`
**Initial Match Rate**: 82%
**Final Match Rate**: 97%

## Summary

MDX 파일 기반 블로그를 Cloudflare D1 + Admin CMS로 마이그레이션하는 작업의 설계-구현 비교 분석.
총 85개 설계 항목 중 84개 완전 일치, 1개 의도적 변경(수용).

## Iteration 1: 수정된 Gap 목록

### 1. Runtime Dependencies 위치 오류 (BLOCKING → Fixed)

unified, remark-*, rehype-* 7개 패키지를 devDependencies → dependencies로 이동

### 2. Dead Files 미삭제 (BLOCKING → Fixed)

`scripts/generate-blog-data.mjs`, `lib/generated/blog-data.ts` 삭제 완료

### 3. PostTable 컴포넌트 미분리 (Medium → Fixed)

`components/admin/post-table.tsx`로 추출, admin blog page에서 사용

### 4. MarkdownEditor 컴포넌트 미분리 (Medium → Fixed)

`components/admin/markdown-editor.tsx` 생성, 툴바(Bold, Italic, Heading, Code, Link) 포함

## Accepted Deviations

| 항목 | 설계 | 구현 | 수용 근거 |
|------|------|------|-----------|
| wrangler.toml routes | `routes = [{...}]` 포함 | 제거 | 로컬 프리뷰 호환성, Dashboard로 설정 |
| 편집 URL 패턴 | `/admin/blog/[id]/edit` | `/admin/blog/[slug]/edit` | slug unique, SEO 친화적 |
| force-static 제거 | directive 제거 | `force-dynamic` 추가 | Workers 런타임 필요 |
| Sitemap 쿼리 | `getAllSlugs()` | `getAllPosts()` | 기능 동일, 미미한 차이 |

## Added Features (설계에 없지만 구현에 포함)

| 항목 | 위치 | 설명 |
|------|------|------|
| `/api/posts/admin` | `app/api/posts/admin/route.ts` | Admin 대시보드용 인증 API (드래프트 포함) |

## Category Scores

| Category | Items | Matched | Score |
|----------|:-----:|:-------:|:-----:|
| File Structure | 20 | 20 | 100% |
| Dependencies | 8 | 8 | 100% |
| D1 Schema | 5 | 5 | 100% |
| Data Layer | 14 | 14 | 100% |
| Markdown Compiler | 5 | 5 | 100% |
| Authentication | 4 | 4 | 100% |
| API Routes | 6 | 6 | 100% |
| Blog Page Modifications | 8 | 8 | 100% |
| Admin Pages | 8 | 8 | 100% |
| wrangler.toml | 7 | 6 | 86% |
| **Total** | **85** | **84** | **97%** |
