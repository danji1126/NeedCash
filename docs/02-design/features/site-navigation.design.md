# Design: site-navigation (PDCA-4)

> **Feature**: site-navigation
> **Plan 문서**: `docs/01-plan/features/site-navigation.plan.md`
> **작성일**: 2026-02-25
> **변경 파일**: CREATE 2 + EDIT 8 = 10개

---

## 1. 구현 순서

```
FR-01 (Breadcrumb 컴포넌트)
  → FR-02 (BreadcrumbList JSON-LD)
    → FR-03 (Footer 내부 링크 강화)
      → FR-04 (블로그 관련 포스트)
        → FR-05 (페이지별 통합)
          → Build 검증
```

---

## 2. FR-01: Breadcrumb 컴포넌트

### 파일: `components/ui/breadcrumb.tsx` (CREATE)

서버 컴포넌트 (no `"use client"`)

```tsx
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-text-muted">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className="mx-1">/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-opacity hover:opacity-50"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-text-secondary">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### 설계 포인트

- `<nav aria-label="breadcrumb">` + `<ol>` 시맨틱 마크업
- 마지막 항목(`href` 없음)은 `aria-current="page"`로 현재 페이지 표시
- 구분자: `/` (aria-hidden)
- 서버 컴포넌트이므로 HTML 소스에 텍스트 직접 포함

---

## 3. FR-02: BreadcrumbList JSON-LD

### 파일: `components/seo/json-ld.tsx` (EDIT - 함수 추가)

기존 `WebSiteJsonLd`, `ArticleJsonLd`, `GameJsonLd` 아래에 추가:

```tsx
// ── BreadcrumbList JSON-LD ──

interface BreadcrumbJsonLdItem {
  name: string;
  href: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbJsonLdItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 설계 포인트

- Schema.org `BreadcrumbList` 스펙 준수
- `position`: 1부터 시작 (1-indexed)
- `item`: 전체 URL (`SITE.url` + `href`)
- 현재 페이지도 목록에 포함 (구글 권장)

---

## 4. FR-03: Footer 내부 링크 강화

### 파일: `lib/constants.ts` (EDIT - FOOTER 데이터 추가)

기존 `NAV_LINKS` 아래에 Footer 링크 데이터 추가:

```ts
export const FOOTER_SECTIONS = [
  {
    title: "콘텐츠",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/game", label: "Game" },
      { href: "/resume", label: "Resume" },
    ],
  },
  {
    title: "게임",
    links: [
      { href: "/game/dice", label: "Dice Roller" },
      { href: "/game/lotto", label: "Lotto Pick" },
      { href: "/game/animal-face", label: "동물상 찾기" },
      { href: "/game/reaction", label: "Reaction Test" },
      { href: "/game/color-sense", label: "Color Sense" },
      { href: "/game/color-memory", label: "Color Memory" },
    ],
  },
  {
    title: "정보",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;
```

### 파일: `components/layout/footer/editorial-footer.tsx` (EDIT - 전면 교체)

```tsx
import Link from "next/link";
import { SITE, FOOTER_SECTIONS } from "@/lib/constants";

export function EditorialFooter() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-6xl px-8">
        <div className="h-px bg-border/40" />
        <div className="grid gap-8 py-12 sm:grid-cols-3">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-text">
                {section.title}
              </p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] tracking-wide text-text-muted transition-opacity hover:opacity-60"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="h-px bg-border/40" />
        <p className="py-6 text-center text-[13px] tracking-wide text-text-muted">
          &copy; {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
```

### 파일: `components/layout/footer/brutalist-footer.tsx` (EDIT - 전면 교체)

```tsx
import Link from "next/link";
import { SITE, FOOTER_SECTIONS } from "@/lib/constants";

export function BrutalistFooter() {
  return (
    <footer className="border-t-[3px] border-border">
      <div className="grid gap-6 px-6 py-8 sm:grid-cols-3">
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-text">
              {section.title}
            </p>
            <ul className="mt-2 space-y-1">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-xs uppercase tracking-wider text-text-muted transition-[background-color,color] duration-[0.05s] hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t-[3px] border-border px-6 py-4">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
          &copy; {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
```

### 파일: `components/layout/footer/bento-footer.tsx` (EDIT - 전면 교체)

```tsx
import Link from "next/link";
import { SITE, FOOTER_SECTIONS } from "@/lib/constants";

export function BentoFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-8 py-12">
      <div className="grid gap-8 sm:grid-cols-3">
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[13px] font-semibold text-text">
              {section.title}
            </p>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-text-muted transition-opacity hover:opacity-60"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[13px] text-text-muted">
        &copy; {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
```

### 파일: `components/layout/footer/glass-footer.tsx` (EDIT - 전면 교체)

```tsx
import Link from "next/link";
import { SITE, FOOTER_SECTIONS } from "@/lib/constants";

export function GlassFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-8 py-12">
      <div className="grid gap-8 sm:grid-cols-3">
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[13px] font-medium text-text/80">
              {section.title}
            </p>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-light text-text-muted transition-opacity hover:opacity-60"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[13px] font-light text-text-muted">
        &copy; {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
```

### Footer 설계 포인트

- 4개 디자인 모두 **동일한 데이터**(`FOOTER_SECTIONS`) 사용
- 3-column grid: 콘텐츠(3) + 게임(6) + 정보(3) = **12개 내부 링크**
- 각 디자인의 스타일 톤 유지 (editorial: 세리프/트래킹, brutalist: 모노/대문자, bento: 깔끔, glass: 가벼운)

---

## 5. FR-04: 블로그 관련 포스트

### 파일: `components/blog/related-posts.tsx` (CREATE)

서버 컴포넌트 (no `"use client"`)

```tsx
import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";

interface RelatedPostsProps {
  currentSlug: string;
}

export function RelatedPosts({ currentSlug }: RelatedPostsProps) {
  const posts = getAllPosts()
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mx-auto h-px max-w-xs bg-border/60" />
      <h2 className="mt-10 font-heading text-xl font-semibold tracking-[-0.01em]">
        다른 글도 읽어보세요
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-lg border border-border/60 p-4 transition-colors hover:bg-bg-secondary"
          >
            <p className="font-heading text-sm font-semibold tracking-[-0.01em]">
              {post.title}
              <span className="ml-1 inline-block text-text-muted transition-transform duration-500 group-hover:translate-x-1">
                &rarr;
              </span>
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-text-secondary">
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### 설계 포인트

- `getAllPosts()`에서 현재 슬러그 제외 후 최근 3개
- 게임 관련 추천(PDCA-3)과 동일한 패턴: 구분선 + H2 + 3-column 카드
- 서버 컴포넌트: HTML에 포스트 제목/설명 직접 포함

---

## 6. FR-05: 페이지별 Breadcrumb + JSON-LD 통합

### 파일: `app/game/[slug]/page.tsx` (EDIT)

```tsx
// 추가 import
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
```

`GameDetailPage` 함수 내부, `<GameJsonLd>` 아래에 추가:

```tsx
<BreadcrumbJsonLd
  items={[
    { name: "홈", href: "/" },
    { name: "게임", href: "/game" },
    { name: game.title, href: `/game/${slug}` },
  ]}
/>
<Breadcrumb
  items={[
    { label: "홈", href: "/" },
    { label: "게임", href: "/game" },
    { label: game.title },
  ]}
/>
```

기존 `<Link href="/game">&larr; Back</Link>` 블록을 `<Breadcrumb>` 으로 **교체**.

### 파일: `app/blog/[slug]/page.tsx` (EDIT)

```tsx
// 추가 import
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { RelatedPosts } from "@/components/blog/related-posts";
```

`BlogPostPage` 함수 내부, `<ArticleJsonLd>` 아래에 추가:

```tsx
<BreadcrumbJsonLd
  items={[
    { name: "홈", href: "/" },
    { name: "블로그", href: "/blog" },
    { name: post.meta.title, href: `/blog/${slug}` },
  ]}
/>
<Breadcrumb
  items={[
    { label: "홈", href: "/" },
    { label: "블로그", href: "/blog" },
    { label: post.meta.title },
  ]}
/>
```

기존 `<Link href="/blog">&larr; Back</Link>` 블록을 `<Breadcrumb>` 으로 **교체**.

`</article>` 닫기 태그 직전에 `<RelatedPosts>` 추가:

```tsx
      <RelatedPosts currentSlug={slug} />
    </article>
```

### 파일: `app/game/page.tsx` (EDIT)

```tsx
// 추가 import
import { Breadcrumb } from "@/components/ui/breadcrumb";
```

`GamePage` 함수 내부, `<ScrollReveal>` 시작 전에 추가:

```tsx
<Breadcrumb
  items={[
    { label: "홈", href: "/" },
    { label: "게임" },
  ]}
/>
```

### 파일: `app/blog/page.tsx` (EDIT)

```tsx
// 추가 import
import { Breadcrumb } from "@/components/ui/breadcrumb";
```

`BlogPage` 함수 내부, `<ScrollReveal>` 시작 전에 추가:

```tsx
<Breadcrumb
  items={[
    { label: "홈", href: "/" },
    { label: "블로그" },
  ]}
/>
```

---

## 7. 변경 파일 요약

| # | 파일 | 변경 | FR |
|---|------|------|-----|
| 1 | `components/ui/breadcrumb.tsx` | CREATE | FR-01 |
| 2 | `components/seo/json-ld.tsx` | EDIT | FR-02 |
| 3 | `lib/constants.ts` | EDIT | FR-03 |
| 4 | `components/layout/footer/editorial-footer.tsx` | EDIT | FR-03 |
| 5 | `components/layout/footer/brutalist-footer.tsx` | EDIT | FR-03 |
| 6 | `components/layout/footer/bento-footer.tsx` | EDIT | FR-03 |
| 7 | `components/layout/footer/glass-footer.tsx` | EDIT | FR-03 |
| 8 | `components/blog/related-posts.tsx` | CREATE | FR-04 |
| 9 | `app/game/[slug]/page.tsx` | EDIT | FR-05 |
| 10 | `app/blog/[slug]/page.tsx` | EDIT | FR-05 |
| 11 | `app/game/page.tsx` | EDIT | FR-05 |
| 12 | `app/blog/page.tsx` | EDIT | FR-05 |

---

## 8. 검증 체크리스트

| # | 항목 | 기준 |
|---|------|------|
| 1 | `pnpm build` 성공 | 0 errors |
| 2 | `pnpm lint` 통과 | 0 warnings |
| 3 | 게임 상세 HTML: `<nav aria-label="breadcrumb">` 존재 | 6페이지 |
| 4 | 블로그 상세 HTML: `<nav aria-label="breadcrumb">` 존재 | 7페이지 |
| 5 | 게임 목록 HTML: `<nav aria-label="breadcrumb">` 존재 | 1페이지 |
| 6 | 블로그 목록 HTML: `<nav aria-label="breadcrumb">` 존재 | 1페이지 |
| 7 | 게임 상세 HTML: `BreadcrumbList` JSON-LD 존재 | 6페이지 |
| 8 | 블로그 상세 HTML: `BreadcrumbList` JSON-LD 존재 | 7페이지 |
| 9 | Footer HTML: 12개+ 내부 링크 (4개 디자인 공통) | 모든 페이지 |
| 10 | 블로그 상세 HTML: "다른 글도 읽어보세요" + 3개 링크 | 7페이지 |
| 11 | `aria-current="page"` breadcrumb 마지막 항목 | 모든 breadcrumb |
| 12 | BreadcrumbList JSON-LD `position` 1-indexed | 모든 JSON-LD |

---

## 9. 기술 제약

- **서버 컴포넌트**: Breadcrumb, RelatedPosts는 `"use client"` 없는 서버 컴포넌트
- **Footer 클라이언트**: Footer는 디자인 스위치 때문에 이미 `"use client"` → 링크 데이터는 `constants.ts`에서 가져와 HTML에 포함되지만, 실제 렌더링은 클라이언트. 이는 기존 구조의 한계이며 구글봇 렌더링 엔진이 처리 가능
- **빌드 호환**: `output: 'export'` 정적 빌드와 호환 필수
