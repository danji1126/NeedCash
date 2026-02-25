# Design: internal-links (PDCA-7)

> **Feature**: internal-links (내부 링크 구조 + 카테고리 재편)
> **Plan 문서**: `docs/01-plan/features/internal-links.plan.md`
> **작성일**: 2026-02-25

---

## 1. 요약

게임 → 블로그 역방향 크로스 링크를 추가하고, RelatedPosts의 카테고리 기반 추천을 개선하며, 블로그 카테고리를 3개로 통합한다.

**Note**: Plan의 FR-04 (블로그 목록 카테고리 필터)는 `PostList` 컴포넌트에 이미 구현되어 있으므로 Design 범위에서 제외한다.

---

## 2. FR 목록

| FR | 제목 | 상태 |
|----|------|------|
| FR-01 | 게임 → 블로그 크로스 링크 | 신규 |
| FR-02 | RelatedPosts 카테고리 기반 추천 | 신규 |
| FR-03 | 블로그 카테고리 정리 (etc/dev → tech) | 신규 |
| ~~FR-04~~ | ~~블로그 목록 카테고리 필터~~ | ~~이미 구현~~ |

---

## 3. FR-01: 게임 → 블로그 크로스 링크

### 3.1 데이터 모델 변경

**파일**: `lib/game-content.ts`

`GameContent` 인터페이스에 `relatedBlog` 필드 추가:

```typescript
export interface GameContent {
  slug: string;
  introduction: string;
  howToPlay: string[];
  scoreGuide: { label: string; value: string; description: string }[];
  background: string;
  faq: { question: string; answer: string }[];
  relatedBlog?: {
    slug: string;
    title: string;
    description: string;
  };
}
```

매핑 데이터:

| 게임 slug | relatedBlog.slug | relatedBlog.title |
|-----------|-----------------|-------------------|
| reaction | reaction-speed-science | 반응 속도의 과학: 당신의 뇌는 얼마나 빠를까? |
| color-sense | color-sense-guide | 색감 테스트로 알아보는 색각의 세계 |
| color-memory | color-memory-science | 기억력과 패턴 인식: 사이먼 게임의 인지과학 |
| dice | (없음) | - |
| lotto | (없음) | - |
| animal-face | (없음) | - |

### 3.2 UI 컴포넌트

**파일**: `components/game/game-content-section.tsx`

`RelatedBlogPost` 컴포넌트를 추가한다. `GameContentSection` 내부 FAQ 섹션 뒤에 조건부 렌더링.

```tsx
interface RelatedBlogPostProps {
  blog: { slug: string; title: string; description: string };
}

function RelatedBlogPost({ blog }: RelatedBlogPostProps) {
  return (
    <div className="mt-12">
      <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
        더 알아보기
      </h2>
      <Link
        href={`/blog/${blog.slug}`}
        className="group mt-3 block rounded-lg border border-border/60 p-5 transition-colors hover:bg-bg-secondary"
      >
        <p className="font-heading text-sm font-semibold tracking-[-0.01em]">
          {blog.title}
          <span className="ml-1 inline-block text-text-muted transition-transform duration-500 group-hover:translate-x-1">
            &rarr;
          </span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {blog.description}
        </p>
      </Link>
    </div>
  );
}
```

### 3.3 레이아웃 순서

현재:
```
GameContentSection (소개, 플레이 방법, 점수 가이드, 배경, FAQ)
RelatedGames
```

변경 후:
```
GameContentSection (소개, 플레이 방법, 점수 가이드, 배경, FAQ, [RelatedBlogPost])
RelatedGames
```

`RelatedBlogPost`는 `GameContentSection` 내부에서 `content.relatedBlog`가 존재할 때만 렌더링.

---

## 4. FR-02: RelatedPosts 카테고리 기반 추천

### 4.1 인터페이스 변경

**파일**: `components/blog/related-posts.tsx`

```typescript
interface RelatedPostsProps {
  currentSlug: string;
  category?: string;  // 추가
}
```

### 4.2 추천 로직

```typescript
export function RelatedPosts({ currentSlug, category }: RelatedPostsProps) {
  const allPosts = getAllPosts().filter((p) => p.slug !== currentSlug);

  // 1순위: 같은 카테고리 포스트 (날짜순)
  const sameCategory = category
    ? allPosts.filter((p) => p.category === category)
    : [];

  // 2순위: 나머지 포스트
  const otherPosts = allPosts.filter(
    (p) => !sameCategory.includes(p)
  );

  // 합쳐서 3개 선택
  const posts = [...sameCategory, ...otherPosts].slice(0, 3);

  // ... 기존 렌더링
}
```

### 4.3 호출부 변경

**파일**: `app/blog/[slug]/page.tsx`

```tsx
// 변경 전
<RelatedPosts currentSlug={slug} />

// 변경 후
<RelatedPosts currentSlug={slug} category={post.meta.category} />
```

---

## 5. FR-03: 블로그 카테고리 정리

### 5.1 변경 대상

| 파일 | 현재 category | 변경 |
|------|-------------|------|
| `content/blog/hello-world.mdx` | etc | **tech** |
| `content/blog/iterm2-korean-fix.mdx` | dev | **tech** |
| `content/blog/nextjs-mdx-blog-guide.mdx` | dev | **tech** |

### 5.2 결과 카테고리 분포

| 카테고리 | 포스트 수 | 포스트 |
|----------|----------|--------|
| tech | 4 | hello-world, getting-started, iterm2-korean-fix, nextjs-mdx-blog-guide |
| review | 3 | speak-100-days, bullterrier, joker-gi |
| science | 3 | reaction-speed, color-sense, color-memory |

### 5.3 변경 내용

각 MDX 파일의 frontmatter에서 `category` 값만 변경:

```yaml
# hello-world.mdx
category: "tech"    # 이전: "etc"

# iterm2-korean-fix.mdx
category: "tech"    # 이전: "dev"

# nextjs-mdx-blog-guide.mdx
category: "tech"    # 이전: "dev"
```

---

## 6. 변경 파일 목록

| # | 파일 | 변경 유형 | FR | 변경 내용 |
|---|------|----------|-----|----------|
| 1 | `lib/game-content.ts` | EDIT | FR-01 | GameContent에 relatedBlog 필드 + 3개 게임 데이터 |
| 2 | `components/game/game-content-section.tsx` | EDIT | FR-01 | RelatedBlogPost 컴포넌트 + GameContentSection에 조건부 렌더링 |
| 3 | `components/blog/related-posts.tsx` | EDIT | FR-02 | category prop 추가 + 카테고리 우선 정렬 로직 |
| 4 | `app/blog/[slug]/page.tsx` | EDIT | FR-02 | RelatedPosts에 category prop 전달 |
| 5 | `content/blog/hello-world.mdx` | EDIT | FR-03 | category: "etc" → "tech" |
| 6 | `content/blog/iterm2-korean-fix.mdx` | EDIT | FR-03 | category: "dev" → "tech" |
| 7 | `content/blog/nextjs-mdx-blog-guide.mdx` | EDIT | FR-03 | category: "dev" → "tech" |

---

## 7. 구현 순서

```
1. FR-03: 카테고리 정리 (MDX frontmatter 수정)
   → 3개 파일 category 변경

2. FR-02: RelatedPosts 개선
   → related-posts.tsx 수정
   → blog/[slug]/page.tsx에서 category prop 전달

3. FR-01: 게임 → 블로그 크로스 링크
   → game-content.ts에 relatedBlog 데이터 추가
   → game-content-section.tsx에 RelatedBlogPost 추가
```

FR-03을 먼저 수행하면 FR-02 테스트 시 카테고리가 이미 정리된 상태로 확인 가능.

---

## 8. 검증 기준

| # | 검증 항목 | FR | 검증 방법 |
|---|----------|-----|----------|
| 1 | `pnpm build` 성공 (0 errors) | ALL | 빌드 실행 |
| 2 | `pnpm lint` 통과 (0 warnings) | ALL | 린트 실행 |
| 3 | reaction 게임 페이지에 "반응 속도의 과학" 블로그 링크 | FR-01 | 빌드 결과 확인 |
| 4 | color-sense 게임 페이지에 "색감 테스트" 블로그 링크 | FR-01 | 빌드 결과 확인 |
| 5 | color-memory 게임 페이지에 "기억력과 패턴 인식" 블로그 링크 | FR-01 | 빌드 결과 확인 |
| 6 | dice/lotto/animal-face 페이지에 블로그 링크 없음 | FR-01 | 빌드 결과 확인 |
| 7 | science 블로그에서 RelatedPosts에 다른 science 포스트 우선 표시 | FR-02 | 코드 로직 확인 |
| 8 | hello-world.mdx category === "tech" | FR-03 | grep 확인 |
| 9 | iterm2-korean-fix.mdx category === "tech" | FR-03 | grep 확인 |
| 10 | nextjs-mdx-blog-guide.mdx category === "tech" | FR-03 | grep 확인 |
| 11 | "etc" 카테고리 포스트 0개 | FR-03 | grep 확인 |
| 12 | "dev" 카테고리 포스트 0개 | FR-03 | grep 확인 |

---

## 9. 기술 노트

### 9.1 정적 빌드 호환성

- `output: 'export'` 모드이므로 모든 데이터는 빌드 타임에 결정됨
- `relatedBlog` 데이터는 `game-content.ts`에 하드코딩 (MDX 파싱 불필요)
- `RelatedPosts`는 서버 컴포넌트에서 `getAllPosts()` 호출하므로 빌드 타임 실행

### 9.2 PostList 카테고리 필터 (이미 구현)

`components/blog/post-list.tsx`에 이미 다음이 구현됨:
- `activeCategory` state로 카테고리 필터링
- `Tag` 컴포넌트로 카테고리 칩 UI
- 카테고리별 태그 필터 연동

카테고리가 `etc`, `dev` → `tech`으로 통합되면 자동으로 3개 카테고리만 표시됨.
