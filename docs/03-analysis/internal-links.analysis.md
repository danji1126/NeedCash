# Gap Analysis: internal-links (PDCA-7)

> **Feature**: internal-links
> **Design 문서**: `docs/02-design/features/internal-links.design.md`
> **분석일**: 2026-02-25
> **Match Rate**: **100% (12/12)**

---

## 1. 검증 결과 요약

| # | 항목 | FR | 결과 | 비고 |
|---|------|----|------|------|
| 1 | `pnpm build` 성공 (0 errors) | ALL | ✅ PASS | 32개 정적 페이지 생성 |
| 2 | `pnpm lint` 통과 (0 warnings) | ALL | ✅ PASS | ESLint 0 errors |
| 3 | reaction 게임 페이지에 블로그 링크 | FR-01 | ✅ PASS | relatedBlog.slug = "reaction-speed-science" |
| 4 | color-sense 게임 페이지에 블로그 링크 | FR-01 | ✅ PASS | relatedBlog.slug = "color-sense-guide" |
| 5 | color-memory 게임 페이지에 블로그 링크 | FR-01 | ✅ PASS | relatedBlog.slug = "color-memory-science" |
| 6 | dice/lotto/animal-face에 블로그 링크 없음 | FR-01 | ✅ PASS | relatedBlog 필드 없음 + 조건부 렌더링 |
| 7 | science 블로그에서 같은 카테고리 우선 표시 | FR-02 | ✅ PASS | sameCategory 우선 정렬 로직 |
| 8 | hello-world.mdx category === "tech" | FR-03 | ✅ PASS | 이전: "etc" → 현재: "tech" |
| 9 | iterm2-korean-fix.mdx category === "tech" | FR-03 | ✅ PASS | 이전: "dev" → 현재: "tech" |
| 10 | nextjs-mdx-blog-guide.mdx category === "tech" | FR-03 | ✅ PASS | 이전: "dev" → 현재: "tech" |
| 11 | "etc" 카테고리 포스트 0개 | FR-03 | ✅ PASS | grep 결과 0건 |
| 12 | "dev" 카테고리 포스트 0개 | FR-03 | ✅ PASS | grep 결과 0건 |

---

## 2. FR별 상세 분석

### FR-01: 게임 → 블로그 크로스 링크

**Design 요구사항 vs 구현:**

| 항목 | Design | 구현 | 일치 |
|------|--------|------|------|
| GameContent.relatedBlog 인터페이스 | `{slug, title, description}` optional | `relatedBlog?: {slug: string; title: string; description: string}` | ✅ |
| reaction 매핑 | slug: "reaction-speed-science" | 정확히 일치 | ✅ |
| color-sense 매핑 | slug: "color-sense-guide" | 정확히 일치 | ✅ |
| color-memory 매핑 | slug: "color-memory-science" | 정확히 일치 | ✅ |
| dice/lotto/animal-face | relatedBlog 없음 | 필드 미포함 | ✅ |
| UI 컴포넌트 위치 | FAQ 뒤, section 내부 | FAQ 뒤 `{content.relatedBlog && ...}` | ✅ |
| 제목 "더 알아보기" | h2 "더 알아보기" | 정확히 일치 | ✅ |
| 카드 UI | 블로그 카드 (title + arrow + description) | Link + 카드 구조 일치 | ✅ |

**구현 차이**: Design에서 별도 `RelatedBlogPost` 컴포넌트를 제안했으나, 구현에서는 `GameContentSection` 내부에 인라인으로 렌더링. 기능 동일, 코드 구조만 상이 (추출 불필요한 단순 UI).

### FR-02: RelatedPosts 카테고리 기반 추천

| 항목 | Design | 구현 | 일치 |
|------|--------|------|------|
| category prop 추가 | `category?: string` | `category?: string` | ✅ |
| 1순위 로직 | 같은 카테고리 필터 | `allPosts.filter(p => p.category === category)` | ✅ |
| 2순위 로직 | 나머지 포스트 | `allPosts.filter(p => !sameCategory.includes(p))` | ✅ |
| 합치기 | `[...sameCategory, ...otherPosts].slice(0, 3)` | 정확히 일치 | ✅ |
| 호출부 | `category={post.meta.category}` | blog/[slug]/page.tsx line 123 | ✅ |

### FR-03: 블로그 카테고리 정리

| 파일 | Design (변경 전 → 후) | 구현 | 일치 |
|------|---------------------|------|------|
| hello-world.mdx | etc → tech | `category: "tech"` | ✅ |
| iterm2-korean-fix.mdx | dev → tech | `category: "tech"` | ✅ |
| nextjs-mdx-blog-guide.mdx | dev → tech | `category: "tech"` | ✅ |

결과 카테고리 분포:

| 카테고리 | Design 목표 | 실제 | 일치 |
|----------|-----------|------|------|
| tech | 4개 | 4개 (hello-world, getting-started, iterm2-korean-fix, nextjs-mdx-blog-guide) | ✅ |
| review | 3개 | 3개 (speak-100-days, bullterrier, joker-gi) | ✅ |
| science | 3개 | 3개 (reaction-speed, color-sense, color-memory) | ✅ |

---

## 3. 변경 파일 검증

| # | 파일 | 변경 유형 | Design | 구현 | 일치 |
|---|------|----------|--------|------|------|
| 1 | `lib/game-content.ts` | EDIT | relatedBlog 인터페이스 + 3개 데이터 | 인터페이스 + 데이터 추가 | ✅ |
| 2 | `components/game/game-content-section.tsx` | EDIT | RelatedBlogPost 렌더링 | 조건부 블로그 링크 렌더링 | ✅ |
| 3 | `components/blog/related-posts.tsx` | EDIT | category prop + 우선 정렬 | 정확히 일치 | ✅ |
| 4 | `app/blog/[slug]/page.tsx` | EDIT | category prop 전달 | 정확히 일치 | ✅ |
| 5 | `content/blog/hello-world.mdx` | EDIT | category → "tech" | 정확히 일치 | ✅ |
| 6 | `content/blog/iterm2-korean-fix.mdx` | EDIT | category → "tech" | 정확히 일치 | ✅ |
| 7 | `content/blog/nextjs-mdx-blog-guide.mdx` | EDIT | category → "tech" | 정확히 일치 | ✅ |

---

## 4. 결론

**Match Rate: 100% (12/12)**

모든 검증 항목을 통과하였으며, Design 문서의 요구사항이 완전히 구현되었습니다.

- **빌드/린트**: 0 errors, 0 warnings (32 페이지)
- **게임→블로그 링크**: 3개 게임에 관련 블로그 링크 추가, 3개 게임은 올바르게 제외
- **RelatedPosts**: 카테고리 우선 정렬 로직 정확히 구현
- **카테고리 정리**: etc/dev → tech 통합 완료, 3개 카테고리 체계

**PDCA 진행: Report 단계로 이동 가능**
