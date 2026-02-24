# Design: seo-infrastructure (PDCA-2)

> **Feature**: seo-infrastructure
> **Plan 문서**: `docs/01-plan/features/seo-infrastructure.plan.md`
> **작성일**: 2026-02-24

---

## 1. 개요

구글봇이 사이트의 모든 콘텐츠를 정확히 인식하고 인덱싱할 수 있는 기술 SEO 기반을 구축한다.

### 제약 사항
- `output: 'export'` (정적 빌드) → `app/sitemap.ts`, `app/robots.ts`는 빌드 시 정적 파일 생성
- API Routes 사용 불가
- 모든 SEO 요소는 빌드 타임에 결정

---

## 2. 요구사항별 상세 설계

### FR-01: 동적 Sitemap 생성

**파일**: `app/sitemap.ts` (CREATE)

```typescript
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/mdx";
import { GAMES } from "@/lib/constants";
import { SITE } from "@/lib/constants";
import { SUPPORTED_LANGUAGES, DEFAULT_LANG } from "@/lib/i18n/languages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE.url;

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/game`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/resume`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // 블로그 포스트
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 게임 페이지
  const gamePages: MetadataRoute.Sitemap = GAMES.map((game) => ({
    url: `${baseUrl}/game/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // 이력서 다국어 페이지
  const resumePages: MetadataRoute.Sitemap = SUPPORTED_LANGUAGES
    .filter((lang) => lang !== DEFAULT_LANG)
    .map((lang) => ({
      url: `${baseUrl}/resume/${lang}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...blogPages, ...gamePages, ...resumePages];
}
```

**삭제**: `public/sitemap.xml` (DELETE) - 충돌 방지

**완료 기준**: `pnpm build` 후 `out/sitemap.xml`에 20+ URL 포함

---

### FR-02: 동적 Robots.txt 생성

**파일**: `app/robots.ts` (CREATE)

```typescript
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
```

**삭제**: `public/robots.txt` (DELETE) - 충돌 방지

**완료 기준**: `pnpm build` 후 `out/robots.txt`에 Allow + Sitemap 포함

---

### FR-03: OpenGraph + Twitter Card 메타태그

#### FR-03a: 루트 레이아웃 기본 OG 설정

**파일**: `app/layout.tsx` (EDIT)

현재 metadata:
```typescript
export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  other: { "google-adsense-account": "ca-pub-7452986546914975" },
};
```

변경 후:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  other: { "google-adsense-account": "ca-pub-7452986546914975" },
};
```

**핵심**: `metadataBase`는 FR-04(canonical)의 기반이기도 함

#### FR-03b: 블로그 목록 페이지

**파일**: `app/blog/page.tsx` (EDIT)

현재:
```typescript
export const metadata: Metadata = {
  title: "Blog",
  description: "Stories and thoughts on development",
};
```

변경 후:
```typescript
export const metadata: Metadata = {
  title: "Blog",
  description: "Stories and thoughts on development",
  openGraph: {
    title: "Blog | NeedCash",
    description: "Stories and thoughts on development",
    url: "/blog",
  },
};
```

#### FR-03c: 블로그 개별 페이지

**파일**: `app/blog/[slug]/page.tsx` (EDIT)

현재 `generateMetadata`:
```typescript
return {
  title: post.meta.title,
  description: post.meta.description,
};
```

변경 후:
```typescript
return {
  title: post.meta.title,
  description: post.meta.description,
  openGraph: {
    title: post.meta.title,
    description: post.meta.description,
    type: "article",
    publishedTime: post.meta.date,
    url: `/blog/${slug}`,
    tags: post.meta.tags,
  },
};
```

#### FR-03d: 게임 목록 페이지

**파일**: `app/game/page.tsx` (EDIT)

현재:
```typescript
export const metadata: Metadata = {
  title: "Games",
  description: "A collection of simple web games",
};
```

변경 후:
```typescript
export const metadata: Metadata = {
  title: "Games",
  description: "A collection of simple web games",
  openGraph: {
    title: "Games | NeedCash",
    description: "A collection of simple web games",
    url: "/game",
  },
};
```

#### FR-03e: 게임 개별 페이지

**파일**: `app/game/[slug]/page.tsx` (EDIT)

현재 `generateMetadata`:
```typescript
return {
  title: game.title,
  description: game.description,
};
```

변경 후:
```typescript
return {
  title: game.title,
  description: game.description,
  openGraph: {
    title: `${game.title} | NeedCash`,
    description: game.description,
    url: `/game/${slug}`,
  },
};
```

#### FR-03f: 이력서 페이지

**파일**: `app/resume/page.tsx` (EDIT) - 기존 metadata에 OG 추가

```typescript
export const metadata: Metadata = {
  title: "Resume",
  description: "Interactive curriculum vitae",
  openGraph: {
    title: "Resume | NeedCash",
    description: "Interactive curriculum vitae",
    url: "/resume",
  },
  alternates: {
    // 기존 hreflang 유지 (FR-08에서 x-default 추가)
  },
};
```

#### FR-03g: 이력서 다국어 페이지

**파일**: `app/resume/[lang]/page.tsx` (EDIT) - generateMetadata에 OG 추가

```typescript
return {
  title: `Resume (${meta.nativeName})`,
  description: `Interactive curriculum vitae - ${meta.name}`,
  openGraph: {
    title: `Resume (${meta.nativeName}) | NeedCash`,
    description: `Interactive curriculum vitae - ${meta.name}`,
    url: `/resume/${langParam}`,
  },
  alternates: {
    // 기존 hreflang 유지 (FR-08에서 x-default 추가)
  },
};
```

---

### FR-04: Canonical URL

**파일**: `app/layout.tsx` (EDIT) - FR-03a와 동시 적용

`metadataBase: new URL(SITE.url)` 설정만으로 Next.js가 자동으로:
- 각 페이지의 `pathname`으로 canonical URL 생성
- OG url을 절대 경로로 변환

별도의 `alternates.canonical` 설정은 불필요 (Next.js가 `metadataBase` + 페이지 경로로 자동 생성).

**완료 기준**: 모든 페이지 `<head>`에 `<link rel="canonical" href="https://needcash.dev/...">` 존재

---

### FR-05: Schema.org JSON-LD (블로그)

**파일**: `components/seo/json-ld.tsx` (CREATE)

```typescript
interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  tags?: string[];
}

export function ArticleJsonLd({ title, description, url, datePublished, tags }: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE.url}${url}`,
    datePublished,
    author: {
      "@type": "Person",
      name: "NeedCash",
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    ...(tags?.length && { keywords: tags.join(", ") }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

**파일**: `app/blog/[slug]/page.tsx` (EDIT)

`<article>` 내부 최상단에 삽입:
```tsx
<ArticleJsonLd
  title={post.meta.title}
  description={post.meta.description}
  url={`/blog/${slug}`}
  datePublished={post.meta.date}
  tags={post.meta.tags}
/>
```

---

### FR-06: Schema.org JSON-LD (게임)

**파일**: `components/seo/json-ld.tsx` (CREATE - FR-05와 같은 파일)

```typescript
interface GameJsonLdProps {
  name: string;
  description: string;
  url: string;
}

export function GameJsonLd({ name, description, url }: GameJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${SITE.url}${url}`,
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

**파일**: `app/game/[slug]/page.tsx` (EDIT)

`<div>` 내부 최상단에 삽입:
```tsx
<GameJsonLd
  name={game.title}
  description={game.description}
  url={`/game/${slug}`}
/>
```

---

### FR-07: Schema.org JSON-LD (사이트)

**파일**: `components/seo/json-ld.tsx` (CREATE - 같은 파일)

```typescript
export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

**파일**: `app/layout.tsx` (EDIT)

`<body>` 직후(DesignProvider 바로 앞)에 삽입:
```tsx
<WebSiteJsonLd />
```

---

### FR-08: 이력서 hreflang 보강

**파일**: `app/resume/page.tsx` (EDIT)

현재 alternates.languages에 x-default 없음. 추가:

```typescript
alternates: {
  languages: {
    ...Object.fromEntries(
      SUPPORTED_LANGUAGES.map((l) => [
        l,
        l === DEFAULT_LANG ? "/resume" : `/resume/${l}`,
      ]),
    ),
    "x-default": "/resume",
  },
},
```

**파일**: `app/resume/[lang]/page.tsx` (EDIT)

동일하게 x-default 추가:

```typescript
alternates: {
  languages: {
    ...Object.fromEntries(
      SUPPORTED_LANGUAGES.map((l) => [
        l,
        l === DEFAULT_LANG ? "/resume" : `/resume/${l}`,
      ]),
    ),
    "x-default": "/resume",
  },
},
```

**완료 기준**: `<link rel="alternate" hreflang="x-default" href="https://needcash.dev/resume">` 존재

---

## 3. 변경 파일 목록

| # | 파일 | 변경 유형 | FR | 상세 |
|---|------|----------|-----|------|
| 1 | `app/layout.tsx` | EDIT | FR-03a, FR-04, FR-07 | metadataBase + OG/Twitter + WebSiteJsonLd |
| 2 | `app/sitemap.ts` | CREATE | FR-01 | 동적 sitemap 생성 |
| 3 | `public/sitemap.xml` | DELETE | FR-01 | 정적 sitemap 제거 |
| 4 | `app/robots.ts` | CREATE | FR-02 | 동적 robots.txt 생성 |
| 5 | `public/robots.txt` | DELETE | FR-02 | 정적 robots.txt 제거 |
| 6 | `app/blog/page.tsx` | EDIT | FR-03b | OG 추가 |
| 7 | `app/blog/[slug]/page.tsx` | EDIT | FR-03c, FR-05 | OG + ArticleJsonLd |
| 8 | `app/game/page.tsx` | EDIT | FR-03d | OG 추가 |
| 9 | `app/game/[slug]/page.tsx` | EDIT | FR-03e, FR-06 | OG + GameJsonLd |
| 10 | `app/resume/page.tsx` | EDIT | FR-03f, FR-08 | OG + x-default hreflang |
| 11 | `app/resume/[lang]/page.tsx` | EDIT | FR-03g, FR-08 | OG + x-default hreflang |
| 12 | `components/seo/json-ld.tsx` | CREATE | FR-05, FR-06, FR-07 | ArticleJsonLd, GameJsonLd, WebSiteJsonLd |

---

## 4. 구현 순서

```
Step 1: FR-04 + FR-03a → app/layout.tsx (metadataBase + OG/Twitter 기본)
Step 2: FR-07         → components/seo/json-ld.tsx 생성 + layout.tsx에 WebSiteJsonLd
Step 3: FR-01         → app/sitemap.ts 생성 + public/sitemap.xml 삭제
Step 4: FR-02         → app/robots.ts 생성 + public/robots.txt 삭제
Step 5: FR-03b~e      → blog/page, blog/[slug]/page, game/page, game/[slug]/page OG 추가
Step 6: FR-05         → blog/[slug]/page에 ArticleJsonLd 삽입
Step 7: FR-06         → game/[slug]/page에 GameJsonLd 삽입
Step 8: FR-03f~g + FR-08 → resume/page, resume/[lang]/page OG + x-default
```

---

## 5. 검증 체크리스트

- [ ] `pnpm build` 성공 (0 errors)
- [ ] `pnpm lint` 통과
- [ ] `out/sitemap.xml` 존재 + 20+ URL 포함
- [ ] `out/robots.txt` 존재 + Allow + Sitemap 포함
- [ ] 홈페이지 HTML: `og:title`, `og:description`, `twitter:card` 존재
- [ ] 홈페이지 HTML: `<script type="application/ld+json">` WebSite 스키마 존재
- [ ] 블로그 개별 HTML: `og:type="article"`, `og:title`, Article JSON-LD 존재
- [ ] 게임 개별 HTML: `og:title`, SoftwareApplication JSON-LD 존재
- [ ] 이력서 HTML: `hreflang="x-default"` 존재
- [ ] 모든 페이지: `<link rel="canonical">` 존재
- [ ] `public/sitemap.xml` 삭제됨
- [ ] `public/robots.txt` 삭제됨
